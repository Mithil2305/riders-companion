const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RideParticipant = sequelize.define(
	"RideParticipant",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		ride_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		rider_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING(30),
			allowNull: false,
			defaultValue: "IN_ZONE",
		},
	},
	{
		tableName: "ride_participant",
		underscored: true,
		timestamps: true,
	},
);

module.exports = RideParticipant;
