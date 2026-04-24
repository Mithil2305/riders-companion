const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const DevicePushToken = sequelize.define(
	"DevicePushToken",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		rider_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		platform: {
			type: DataTypes.STRING,
			allowNull: false,
			defaultValue: "unknown",
		},
		token: {
			type: DataTypes.STRING,
			allowNull: false,
			unique: true,
		},
		last_seen_at: {
			type: DataTypes.DATE,
			allowNull: false,
			defaultValue: DataTypes.NOW,
		},
	},
	{
		tableName: "device_push_token",
		underscored: true,
		timestamps: true,
	},
);

module.exports = DevicePushToken;
