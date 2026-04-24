const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Notification = sequelize.define(
	"Notification",
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
		actor_id: {
			type: DataTypes.UUID,
			allowNull: true,
		},
		type: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		title: {
			type: DataTypes.STRING,
			allowNull: false,
		},
		body: {
			type: DataTypes.TEXT,
			allowNull: false,
		},
		entity_type: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		entity_id: {
			type: DataTypes.STRING,
			allowNull: true,
		},
		metadata: {
			type: DataTypes.JSONB,
			allowNull: false,
			defaultValue: {},
		},
		read_at: {
			type: DataTypes.DATE,
			allowNull: true,
		},
	},
	{
		tableName: "notification",
		underscored: true,
		timestamps: true,
	},
);

module.exports = Notification;
