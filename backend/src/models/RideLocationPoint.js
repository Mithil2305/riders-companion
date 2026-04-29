const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RideLocationPoint = sequelize.define(
	"RideLocationPoint",
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
		latitude: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		longitude: {
			type: DataTypes.DOUBLE,
			allowNull: false,
		},
		device_speed_kmh: {
			type: DataTypes.DOUBLE,
			allowNull: true,
		},
		normalized_speed_kmh: {
			type: DataTypes.DOUBLE,
			allowNull: true,
		},
		heading: {
			type: DataTypes.DOUBLE,
			allowNull: true,
		},
		accuracy: {
			type: DataTypes.DOUBLE,
			allowNull: true,
		},
		altitude: {
			type: DataTypes.DOUBLE,
			allowNull: true,
		},
		source_timestamp: {
			type: DataTypes.DATE,
			allowNull: false,
		},
		is_latest: {
			type: DataTypes.BOOLEAN,
			allowNull: false,
			defaultValue: true,
		},
	},
	{
		tableName: "ride_location_point",
		underscored: true,
		timestamps: true,
		updatedAt: false,
		indexes: [
			{
				fields: ["ride_id", "rider_id", "created_at"],
			},
			{
				fields: ["ride_id", "is_latest"],
			},
		],
	},
);

module.exports = RideLocationPoint;
