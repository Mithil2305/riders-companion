require("dotenv").config();

const { sequelize } = require("../models");

async function run() {
	try {
		await sequelize.authenticate();
		await sequelize.sync();
		console.log("Database connection successful. Tables are created/synced.");
		process.exit(0);
	} catch (error) {
		console.error("Failed to sync tables:", error.message);
		process.exit(1);
	}
}

run();
