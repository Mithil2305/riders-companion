function shouldAlterSchema() {
	return process.env.NODE_ENV !== "production";
}

async function syncDatabaseSchema(sequelize) {
	const alter = shouldAlterSchema();

	await sequelize.sync({ alter });

	return { alter };
}

module.exports = {
	shouldAlterSchema,
	syncDatabaseSchema,
};
