const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Friend = sequelize.define(
	"Friend",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		user_id_1: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		user_id_2: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		status: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: "PENDING",
		},
	},
	{
		tableName: "friends",
		underscored: true,
		timestamps: true,
	},
);

module.exports = Friend;
