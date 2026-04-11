const { DataTypes } = require("sequelize");
const sequelize = require("../config/database");

const CommunityMember = sequelize.define(
	"CommunityMember",
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
		rider_id: {
			type: DataTypes.UUID,
			allowNull: false,
		},
		role: {
			type: DataTypes.STRING(20),
			allowNull: false,
			defaultValue: "MEMBER",
		},
	},
	{
		tableName: "community_member",
		underscored: true,
		timestamps: true,
	},
);

module.exports = CommunityMember;
