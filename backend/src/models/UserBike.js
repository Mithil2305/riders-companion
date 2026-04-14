const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserBike = sequelize.define(
	"UserBike",
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
		brand: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		model: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		year: {
			type: DataTypes.INTEGER,
			allowNull: false,
		},
		bike_image_url: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		is_primary: {
			type: DataTypes.BOOLEAN,
			defaultValue: false,
		},
	},
	{
		tableName: "user_bike",
		underscored: true,
		timestamps: false,
	},
);

module.exports = UserBike;
