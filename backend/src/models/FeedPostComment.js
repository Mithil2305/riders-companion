const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const FeedPostComment = sequelize.define(
	"FeedPostComment",
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
		comment_text: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		tableName: "feed_post_comment",
		underscored: true,
		timestamps: true,
		updatedAt: false,
	},
);

module.exports = FeedPostComment;
