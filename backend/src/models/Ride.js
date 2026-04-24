const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Ride = sequelize.define(
	"Ride",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		community_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: "PLANNING",
		},
		route_polygon: {
			type: DataTypes.JSONB,
			allowNull: true,
		},
	},
	{
		tableName: "ride",
		underscored: true,
		timestamps: true,
	},
);

module.exports = Ride;
