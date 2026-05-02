require("dotenv").config();

const { Op } = require("sequelize");
const { sequelize, RiderAccount } = require("../models");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@rider.com";

async function checkDatabaseState() {
	console.log("=== DATABASE STATE CHECK ===\n");

	const [tables] = await sequelize.query(`
		SELECT table_name 
		FROM information_schema.tables 
		WHERE table_schema = 'public' 
		ORDER BY table_name
	`);

	console.log("Tables and row counts:");
	console.log("-".repeat(50));

	for (const { table_name } of tables) {
		const [result] = await sequelize.query(
			`SELECT COUNT(*) as count FROM "${table_name}"`,
		);
		console.log(`${table_name.padEnd(30)} ${result[0].count} rows`);
	}

	console.log("\n=== RIDER ACCOUNTS ===");
	const riders = await RiderAccount.findAll({
		attributes: ["id", "email", "username", "name", "created_at"],
		order: [["created_at", "ASC"]],
	});

	for (const rider of riders) {
		const isAdmin = rider.email === ADMIN_EMAIL ? " [ADMIN]" : "";
		console.log(`- ${rider.email} (${rider.username})${isAdmin}`);
	}

	console.log(`\nTotal accounts: ${riders.length}`);
	const nonAdminCount = riders.filter((r) => r.email !== ADMIN_EMAIL).length;
	console.log(`Non-admin accounts: ${nonAdminCount}`);

	return { tables, riders, nonAdminCount };
}

async function cleanNonAdminData() {
	console.log("\n=== CLEANING NON-ADMIN DATA ===\n");

	const admin = await RiderAccount.findOne({
		where: { email: ADMIN_EMAIL },
	});

	if (!admin) {
		console.error("Admin account not found! Aborting.");
		return;
	}

	console.log(`Admin account found: ${admin.id} (${admin.email})`);

	// Use transaction for safe cleanup
	const t = await sequelize.transaction();

	try {
		// Delete in order respecting foreign key constraints (child tables first)
		const deleteQueries = [
			// Ride-related tables
			`DELETE FROM "ride_location_point" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "ride_participant" WHERE ride_id IN (SELECT id FROM ride WHERE creator_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}'))`,
			`DELETE FROM "ride" WHERE creator_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,

			// Community-related
			`DELETE FROM "community_member" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "community" WHERE creator_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,

			// Feed posts
			`DELETE FROM "feed_post_comment_like" WHERE feed_post_comment_id IN (SELECT id FROM feed_post_comment WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}'))`,
			`DELETE FROM "feed_post_comment_like" WHERE feed_post_id IN (SELECT id FROM feed_post WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}'))`,
			`DELETE FROM "feed_post_comment" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "feed_post_like" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "feed_post" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,

			// Clips
			`DELETE FROM "clip_comment" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "clip_like" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "clip" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,

			// Other tables
			`DELETE FROM "tracker" WHERE follower_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}') OR following_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "notification" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}') OR actor_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "device_push_token" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "friends" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}') OR friend_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "group_chat_invitation" WHERE inviter_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}') OR invited_rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "user_bike" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,
			`DELETE FROM "user_encrypted_chat" WHERE rider_id IN (SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}')`,

			// Finally delete non-admin accounts
			`DELETE FROM "rider_account" WHERE email != '${ADMIN_EMAIL}' RETURNING id, email, username`,
		];

		let totalDeleted = 0;
		for (let i = 0; i < deleteQueries.length; i++) {
			const query = deleteQueries[i];
			const savepoint = `sp_${i}`;
			try {
				// Create savepoint to isolate this query
				await sequelize.query(`SAVEPOINT ${savepoint}`, { transaction: t });
				const [result] = await sequelize.query(query, { transaction: t });
				await sequelize.query(`RELEASE SAVEPOINT ${savepoint}`, { transaction: t });

				if (result && result.length > 0 && result[0].email) {
					// This is the final DELETE...RETURNING
					totalDeleted = result.length;
					console.log(`\nDeleted ${result.length} non-admin accounts:`);
					for (const account of result) {
						console.log(`  - ${account.email} (${account.username})`);
					}
				}
			} catch (err) {
				// Rollback to savepoint and continue
				try {
					await sequelize.query(`ROLLBACK TO SAVEPOINT ${savepoint}`, { transaction: t });
				} catch (e) {
					// Savepoint might not exist if error was on SAVEPOINT command itself
				}
				const table = query.match(/DELETE FROM "([^"]+)"/)?.[1] || 'unknown';
				console.log(`  Skipped ${table}: ${err.message.split(':')[0]}`);
			}
		}

		await t.commit();
		console.log(`\n=== CLEANUP COMPLETE ===`);
		console.log(`Removed ${totalDeleted} non-admin accounts and all related data.`);
	} catch (error) {
		await t.rollback();
		throw error;
	}
}

async function main() {
	const command = process.argv[2];

	if (command === "check") {
		await checkDatabaseState();
	} else if (command === "clean") {
		const { nonAdminCount } = await checkDatabaseState();

		if (nonAdminCount === 0) {
			console.log("\nNo non-admin accounts found. Database is already clean.");
			return;
		}

		console.log("\n⚠️  WARNING: This will delete all non-admin accounts and related data!");
		console.log("Admin account to keep:", ADMIN_EMAIL);

		await cleanNonAdminData();
		await checkDatabaseState();
	} else {
		console.log("Usage:");
		console.log("  node cleanDatabase.js check   - View database state");
		console.log("  node cleanDatabase.js clean   - Remove all non-admin data");
	}

	await sequelize.close();
}

main().catch((err) => {
	console.error("Error:", err.message);
	process.exit(1);
});
