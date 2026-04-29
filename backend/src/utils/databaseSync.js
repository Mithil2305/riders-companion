function shouldAlterSchema() {
	return process.env.NODE_ENV !== "production";
}

async function ensureRideCreatorColumn(sequelize) {
	await sequelize.query(`
		ALTER TABLE ride
		ADD COLUMN IF NOT EXISTS creator_id UUID;
	`);

	await sequelize.query(`
		UPDATE ride AS r
		SET creator_id = rp.rider_id
		FROM (
			SELECT DISTINCT ON (ride_id) ride_id, rider_id
			FROM ride_participant
			ORDER BY ride_id, created_at ASC NULLS LAST, id ASC
		) AS rp
		WHERE r.id = rp.ride_id
			AND r.creator_id IS NULL;
	`);

	await sequelize.query(`
		UPDATE ride AS r
		SET creator_id = c.creator_id
		FROM community AS c
		WHERE r.community_id = c.id
			AND r.creator_id IS NULL;
	`);
}

async function ensureGroupInvitationRideColumn(sequelize) {
	await sequelize.query(`
		ALTER TABLE group_chat_invitation
		ADD COLUMN IF NOT EXISTS ride_id UUID;
	`);

	await sequelize.query(`
		CREATE INDEX IF NOT EXISTS idx_group_chat_invitation_community_ride_rider
		ON group_chat_invitation (community_id, ride_id, invited_rider_id);
	`);
}

async function ensureRideLocationIndexes(sequelize) {
	await sequelize.query(`
		CREATE INDEX IF NOT EXISTS idx_ride_location_point_ride_rider_created
		ON ride_location_point (ride_id, rider_id, created_at);
	`);

	await sequelize.query(`
		CREATE INDEX IF NOT EXISTS idx_ride_location_point_ride_latest
		ON ride_location_point (ride_id, is_latest);
	`);
}

async function syncDatabaseSchema(sequelize) {
	const alter = shouldAlterSchema();

	await ensureRideCreatorColumn(sequelize);
	await ensureGroupInvitationRideColumn(sequelize);
	await sequelize.sync({ alter });
	await ensureRideLocationIndexes(sequelize);

	return { alter };
}

module.exports = {
	ensureRideCreatorColumn,
	shouldAlterSchema,
	syncDatabaseSchema,
};
