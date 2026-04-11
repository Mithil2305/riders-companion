const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const RiderAccount = sequelize.define(
	"RiderAccount",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		firebase_uid: {
			type: DataTypes.STRING(128),
			unique: true,
			allowNull: false,
		},
		email: {
			type: DataTypes.STRING(255),
			unique: true,
			allowNull: false,
		},
		username: {
			type: DataTypes.STRING(50),
			unique: true,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		bio: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		profile_image_url: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		banner_image_url: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		total_miles: {
			type: DataTypes.DECIMAL(10, 2),
			defaultValue: 0.0,
		},
	},
	{
		tableName: "rider_account",
		underscored: true,
		timestamps: true,
	},
);

module.exports = RiderAccount;
