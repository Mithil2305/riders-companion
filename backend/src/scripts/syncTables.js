require("dotenv").config();

const { sequelize } = require("../models");
const { syncDatabaseSchema } = require("../utils/databaseSync");

async function run() {
	try {
		await sequelize.authenticate();
		const { alter } = await syncDatabaseSchema(sequelize);
		console.log(
			`Database connection successful. Tables are created/synced${alter ? " with alter" : ""}.`,
		);
		process.exit(0);
	} catch (error) {
		console.error("Failed to sync tables:", error.message);
		process.exit(1);
	}
}

run();
