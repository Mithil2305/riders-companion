const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const GroupChatInvitation = sequelize.define(
	"GroupChatInvitation",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		community_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		inviter_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		invited_rider_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: "PENDING",
			// Values: PENDING, ACCEPTED, DECLINED
		},
	},
	{
		tableName: "group_chat_invitation",
		underscored: true,
		timestamps: true,
		updatedAt: false,
	},
);

module.exports = GroupChatInvitation;
