require("dotenv").config();

const { Client } = require("pg");
const { URL } = require("url");

function getDatabaseName(connectionUrl) {
	const parsed = new URL(connectionUrl);
	return parsed.pathname.replace("/", "");
}

function getAdminConnectionUrl(connectionUrl) {
	const parsed = new URL(connectionUrl);
	parsed.pathname = "/postgres";
	return parsed.toString();
}

async function createDatabaseIfMissing() {
	const databaseUrl = process.env.DATABASE_URL;

	if (!databaseUrl) {
		throw new Error("DATABASE_URL is required");
	}

	const dbName = getDatabaseName(databaseUrl);
	const adminClient = new Client({
		connectionString: getAdminConnectionUrl(databaseUrl),
	});

	await adminClient.connect();

	try {
		const check = await adminClient.query(
			"SELECT 1 FROM pg_database WHERE datname = $1",
			[dbName],
		);

		if (check.rowCount === 0) {
			await adminClient.query(`CREATE DATABASE \"${dbName}\"`);
			console.log(`Created database: ${dbName}`);
		} else {
			console.log(`Database already exists: ${dbName}`);
		}
	} finally {
		await adminClient.end();
	}
}

async function syncTables() {
	const { sequelize } = require("../models");
	await sequelize.authenticate();
	await sequelize.sync();
	console.log("All tables created/synced successfully.");
}

async function run() {
	try {
		await createDatabaseIfMissing();
		await syncTables();
		process.exit(0);
	} catch (error) {
		console.error("Database initialization failed:");
		console.error(error);
		if (error && error.stack) {
			console.error(error.stack);
		}
		process.exit(1);
	}
}

run();
