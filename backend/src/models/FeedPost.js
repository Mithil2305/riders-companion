const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeedPost = sequelize.define(
	"FeedPost",
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
		caption: {
			type: DataTypes.TEXT,
			allowNull: true,
		},
		media_url: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
		media_type: {
			type: DataTypes.STRING(20),
			allowNull: true,
		},
	},
	{
		tableName: "feed_post",
		underscored: true,
		timestamps: true,
		updatedAt: false,
	},
);

module.exports = FeedPost;
