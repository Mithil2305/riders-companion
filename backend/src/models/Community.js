const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const Community = sequelize.define(
	"Community",
	{
		id: {
			type: DataTypes.UUID,
			defaultValue: DataTypes.UUIDV4,
			primaryKey: true,
		},
		creator_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		name: {
			type: DataTypes.STRING(100),
			allowNull: false,
		},
		password: {
			type: DataTypes.STRING(255),
			allowNull: true,
		},
	},
	{
		tableName: "community",
		underscored: true,
		timestamps: true,
	},
);

module.exports = Community;
