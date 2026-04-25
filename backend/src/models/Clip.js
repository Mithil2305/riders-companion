const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Clip = sequelize.define(
	"Clip",
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
		video_url: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		caption: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		song_id: {
			type: DataTypes.STRING(100),
			allowNull: true,
		},
	},
	{
		tableName: "clip",
		underscored: true,
		timestamps: true,
		updatedAt: false,
	},
);

module.exports = Clip;
