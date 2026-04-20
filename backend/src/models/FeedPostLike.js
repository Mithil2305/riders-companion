const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeedPostLike = sequelize.define(
	"FeedPostLike",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		feed_post_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		rider_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
	},
	{
		tableName: "feed_post_like",
		underscored: true,
		timestamps: true,
		updatedAt: false,
		indexes: [
			{
				unique: true,
				fields: ["feed_post_id", "rider_id"],
			},
		],
	},
);

module.exports = FeedPostLike;
