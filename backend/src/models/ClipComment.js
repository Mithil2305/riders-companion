const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const ClipComment = sequelize.define(
	"ClipComment",
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
		comment_text: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
	},
	{
		tableName: "clip_comment",
		underscored: true,
		timestamps: true,
		updatedAt: false,
	},
);

module.exports = ClipComment;
