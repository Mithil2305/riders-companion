const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Tracker = sequelize.define(
	"Tracker",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		follower_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		following_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
	},
	{
		tableName: "tracker",
		underscored: true,
		timestamps: true,
		indexes: [
			{
				unique: true,
				fields: ["follower_id", "following_id"],
			},
		],
	},
);

module.exports = Tracker;
