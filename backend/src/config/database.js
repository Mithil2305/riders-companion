const { Sequelize } = require("sequelize");

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
	throw new Error("DATABASE_URL is required");
}

const normalizeSslFlag = (value) => {
	if (!value) {
		return false;
	}

	const normalized = String(value).trim().toLowerCase();
	return ["true", "1", "require", "required", "on"].includes(normalized);
};

const urlRequestsSsl = /sslmode=require/i.test(databaseUrl);
const envRequestsSsl =
	normalizeSslFlag(process.env.DB_SSL) ||
	normalizeSslFlag(process.env.DB_SSLMODE);
const shouldUseSsl = urlRequestsSsl || envRequestsSsl;

const sequelize = new Sequelize(databaseUrl, {
	dialect: "postgres",
	logging: false,
	dialectOptions: {
		ssl: shouldUseSsl
			? {
					require: true,
					rejectUnauthorized: false,
				}
			: false,
	},
});

module.exports = sequelize;
