const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClipLike = sequelize.define(
	"ClipLike",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		clip_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		rider_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
	},
	{
		tableName: "clip_like",
		underscored: true,
		timestamps: true,
		updatedAt: false,
		indexes: [
			{
				unique: true,
				fields: ["clip_id", "rider_id"],
			},
		],
	},
);

module.exports = ClipLike;
