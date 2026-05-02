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

	// Disable foreign key checks temporarily
	await sequelize.query("SET session_replication_role = 'replica';");

	try {
		// Get all tables that depend on rider_account
		const [dependentTables] = await sequelize.query(`
			SELECT tc.table_name, kcu.column_name
			FROM information_schema.table_constraints tc
			JOIN information_schema.key_column_usage kcu 
				ON tc.constraint_name = kcu.constraint_name
			WHERE tc.constraint_type = 'FOREIGN KEY' 
				AND kcu.column_name IN ('rider_id', 'creator_id', 'follower_id', 'following_id', 'actor_id', 'inviter_id', 'invited_rider_id')
			ORDER BY tc.table_name
		`);

		// Delete from dependent tables first
		const tablesToClean = [
			"user_bike",
			"user_encrypted_chat",
			"feed_post_like",
			"feed_post_comment_like",
			"feed_post_comment",
			"feed_post",
			"clip_like",
			"clip_comment",
			"clip",
			"tracker",
			"notification",
			"device_push_token",
			"friend",
			"group_chat_invitation",
			"ride_location_point",
			"ride_participant",
			"ride",
			"community_member",
			"community",
		];

		for (const table of tablesToClean) {
			try {
				// Delete records where rider_id references non-admin accounts
				const [result] = await sequelize.query(`
					DELETE FROM "${table}" 
					WHERE rider_id IN (
						SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}'
					)
				`);
				console.log(`Cleaned ${table}: removed rider-related records`);
			} catch (err) {
				// Table might not have rider_id, try other common FK columns
				try {
					await sequelize.query(`
						DELETE FROM "${table}" 
						WHERE creator_id IN (
							SELECT id FROM rider_account WHERE email != '${ADMIN_EMAIL}'
						)
					`);
					console.log(`Cleaned ${table}: removed creator-related records`);
				} catch (e) {
					// Silent fail - table might not have the column
				}
			}
		}

		// Finally, delete non-admin rider accounts
		const [deleteResult] = await sequelize.query(`
			DELETE FROM rider_account 
			WHERE email != '${ADMIN_EMAIL}'
			RETURNING id, email, username
		`);

		console.log(`\nDeleted ${deleteResult.length} non-admin accounts:`);
		for (const account of deleteResult) {
			console.log(`  - ${account.email} (${account.username})`);
		}

		console.log("\n=== CLEANUP COMPLETE ===");
	} finally {
		// Re-enable foreign key checks
		await sequelize.query("SET session_replication_role = 'origin';");
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
