require("dotenv").config();

const { Op } = require("sequelize");
const admin = require("../config/firebaseAdmin");
const { sequelize, RiderAccount } = require("../models");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@rider.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";
const ADMIN_NAME = process.env.ADMIN_NAME || "Admin";
const ADMIN_USERNAME = process.env.ADMIN_USERNAME || "admin_rider";

async function ensureFirebaseAdminUser() {
	let firebaseUser;

	try {
		firebaseUser = await admin.auth().getUserByEmail(ADMIN_EMAIL);
		firebaseUser = await admin.auth().updateUser(firebaseUser.uid, {
			email: ADMIN_EMAIL,
			password: ADMIN_PASSWORD,
			displayName: ADMIN_NAME,
			emailVerified: true,
			disabled: false,
		});
		console.log(`Firebase user updated: ${firebaseUser.uid}`);
	} catch (error) {
		if (error.code === "auth/user-not-found") {
			firebaseUser = await admin.auth().createUser({
				email: ADMIN_EMAIL,
				password: ADMIN_PASSWORD,
				displayName: ADMIN_NAME,
				emailVerified: true,
				disabled: false,
			});
			console.log(`Firebase user created: ${firebaseUser.uid}`);
		} else {
			throw error;
		}
	}

	return firebaseUser;
}

async function pickAvailableUsername(baseUsername) {
	let candidate = baseUsername;
	let count = 1;

	while (true) {
		const existing = await RiderAccount.findOne({
			where: { username: candidate },
		});
		if (!existing) {
			return candidate;
		}
		if (existing.email === ADMIN_EMAIL) {
			return existing.username;
		}
		candidate = `${baseUsername}_${count}`;
		count += 1;
	}
}

async function ensureRiderAccountColumns() {
	await sequelize.query(`
		ALTER TABLE rider_account
		ADD COLUMN IF NOT EXISTS mobile_number VARCHAR(20),
		ADD COLUMN IF NOT EXISTS driver_license_number VARCHAR(80),
		ADD COLUMN IF NOT EXISTS profile_setup_completed_at TIMESTAMPTZ;
	`);
}

async function ensureDatabaseAdminUser(firebaseUid) {
	await sequelize.authenticate();
	await ensureRiderAccountColumns();
	await RiderAccount.sync();

	const existingAdmin = await RiderAccount.findOne({
		where: {
			[Op.or]: [{ email: ADMIN_EMAIL }, { firebase_uid: firebaseUid }],
		},
	});

	const payload = {
		firebase_uid: firebaseUid,
		email: ADMIN_EMAIL,
		name: ADMIN_NAME,
		profile_setup_completed_at: new Date(),
	};

	if (existingAdmin) {
		await existingAdmin.update(payload);
		console.log(`DB admin user updated: ${existingAdmin.id}`);
		return existingAdmin;
	}

	const username = await pickAvailableUsername(ADMIN_USERNAME);
	const created = await RiderAccount.create({
		...payload,
		username,
	});
	console.log(`DB admin user created: ${created.id}`);
	return created;
}

async function run() {
	try {
		console.log("Seeding admin user in Firebase Auth and PostgreSQL...");
		const firebaseUser = await ensureFirebaseAdminUser();
		await ensureDatabaseAdminUser(firebaseUser.uid);
		console.log("Admin seed completed successfully.");
		process.exit(0);
	} catch (error) {
		console.error("Admin seed failed:", error.message);
		if (error.code) {
			console.error("Firebase error code:", error.code);
		}
		process.exit(1);
	}
}

run();
