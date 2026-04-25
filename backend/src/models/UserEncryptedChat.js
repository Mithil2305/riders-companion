const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const UserEncryptedChat = sequelize.define(
	"UserEncryptedChat",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		sender_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		receiver_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		room_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		encrypted_payload: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		iv: {
			type: DataTypes.STRING(255),
			allowNull: false,
		},
		attachment_url: {
			type: DataTypes.STRING(512),
			allowNull: true,
		},
	},
	{
		tableName: "user_encrypted_chat",
		underscored: true,
		timestamps: true,
		updatedAt: false,
	},
);

module.exports = UserEncryptedChat;
