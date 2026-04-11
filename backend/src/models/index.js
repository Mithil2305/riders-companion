const sequelize = require("../config/database");

const RiderAccount = require("./RiderAccount");
const UserBike = require("./UserBike");
const UserEncryptedChat = require("./UserEncryptedChat");
const FeedPost = require("./FeedPost");
const Ride = require("./Ride");
const Clip = require("./Clip");
const Tracker = require("./Tracker");
const Friend = require("./Friend");
const Community = require("./Community");
const CommunityMember = require("./CommunityMember");
const RideParticipant = require("./RideParticipant");

RiderAccount.hasMany(UserBike, { foreignKey: "rider_id" });
UserBike.belongsTo(RiderAccount, { foreignKey: "rider_id" });

RiderAccount.hasMany(FeedPost, { foreignKey: "rider_id" });
FeedPost.belongsTo(RiderAccount, { foreignKey: "rider_id" });

RiderAccount.hasMany(Clip, { foreignKey: "rider_id" });
Clip.belongsTo(RiderAccount, { foreignKey: "rider_id" });

RiderAccount.hasMany(Community, { foreignKey: "creator_id" });
Community.belongsTo(RiderAccount, { foreignKey: "creator_id" });

Community.hasMany(CommunityMember, { foreignKey: "community_id" });
CommunityMember.belongsTo(Community, { foreignKey: "community_id" });

RiderAccount.hasMany(CommunityMember, { foreignKey: "rider_id" });
CommunityMember.belongsTo(RiderAccount, { foreignKey: "rider_id" });

Community.hasMany(Ride, { foreignKey: "community_id" });
Ride.belongsTo(Community, { foreignKey: "community_id" });

Ride.hasMany(RideParticipant, { foreignKey: "ride_id" });
RideParticipant.belongsTo(Ride, { foreignKey: "ride_id" });

RiderAccount.hasMany(RideParticipant, { foreignKey: "rider_id" });
RideParticipant.belongsTo(RiderAccount, { foreignKey: "rider_id" });

module.exports = {
	sequelize,
	RiderAccount,
	UserBike,
	UserEncryptedChat,
	FeedPost,
	Ride,
	Clip,
	Tracker,
	Friend,
	Community,
	CommunityMember,
	RideParticipant,
};
