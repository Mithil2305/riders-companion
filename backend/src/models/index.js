const sequelize = require("../config/database");

const RiderAccount = require("./RiderAccount");
const UserBike = require("./UserBike");
const UserEncryptedChat = require("./UserEncryptedChat");
const FeedPost = require("./FeedPost");
const FeedPostLike = require("./FeedPostLike");
const FeedPostComment = require("./FeedPostComment");
const Ride = require("./Ride");
const Clip = require("./Clip");
const ClipLike = require("./ClipLike");
const ClipComment = require("./ClipComment");
const Tracker = require("./Tracker");
const Notification = require("./Notification");
const DevicePushToken = require("./DevicePushToken");
const Friend = require("./Friend");
const Community = require("./Community");
const CommunityMember = require("./CommunityMember");
const RideParticipant = require("./RideParticipant");

RiderAccount.hasMany(UserBike, { foreignKey: "rider_id" });
UserBike.belongsTo(RiderAccount, { foreignKey: "rider_id" });

RiderAccount.hasMany(FeedPost, { foreignKey: "rider_id" });
FeedPost.belongsTo(RiderAccount, { foreignKey: "rider_id" });

FeedPost.hasMany(FeedPostLike, { foreignKey: "feed_post_id" });
FeedPostLike.belongsTo(FeedPost, { foreignKey: "feed_post_id" });

FeedPost.hasMany(FeedPostComment, { foreignKey: "feed_post_id" });
FeedPostComment.belongsTo(FeedPost, { foreignKey: "feed_post_id" });

RiderAccount.hasMany(FeedPostLike, { foreignKey: "rider_id" });
FeedPostLike.belongsTo(RiderAccount, { foreignKey: "rider_id" });

RiderAccount.hasMany(FeedPostComment, { foreignKey: "rider_id" });
FeedPostComment.belongsTo(RiderAccount, { foreignKey: "rider_id" });

RiderAccount.hasMany(Clip, { foreignKey: "rider_id" });
Clip.belongsTo(RiderAccount, { foreignKey: "rider_id" });

Clip.hasMany(ClipLike, { foreignKey: "clip_id" });
ClipLike.belongsTo(Clip, { foreignKey: "clip_id" });

Clip.hasMany(ClipComment, { foreignKey: "clip_id" });
ClipComment.belongsTo(Clip, { foreignKey: "clip_id" });

RiderAccount.hasMany(ClipLike, { foreignKey: "rider_id" });
ClipLike.belongsTo(RiderAccount, { foreignKey: "rider_id" });

RiderAccount.hasMany(ClipComment, { foreignKey: "rider_id" });
ClipComment.belongsTo(RiderAccount, { foreignKey: "rider_id" });

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

RiderAccount.hasMany(Notification, {
	foreignKey: "rider_id",
	as: "notifications",
});
Notification.belongsTo(RiderAccount, {
	foreignKey: "rider_id",
	as: "recipient",
});

RiderAccount.hasMany(Notification, {
	foreignKey: "actor_id",
	as: "activityNotifications",
});
Notification.belongsTo(RiderAccount, { foreignKey: "actor_id", as: "actor" });

RiderAccount.hasMany(DevicePushToken, { foreignKey: "rider_id" });
DevicePushToken.belongsTo(RiderAccount, { foreignKey: "rider_id" });

RiderAccount.hasMany(Tracker, {
	foreignKey: "follower_id",
	as: "followingLinks",
});
RiderAccount.hasMany(Tracker, {
	foreignKey: "following_id",
	as: "followerLinks",
});
Tracker.belongsTo(RiderAccount, { foreignKey: "follower_id", as: "follower" });
Tracker.belongsTo(RiderAccount, {
	foreignKey: "following_id",
	as: "following",
});

module.exports = {
	sequelize,
	RiderAccount,
	UserBike,
	UserEncryptedChat,
	FeedPost,
	FeedPostLike,
	FeedPostComment,
	Ride,
	Clip,
	ClipLike,
	ClipComment,
	Tracker,
	Notification,
	DevicePushToken,
	Friend,
	Community,
	CommunityMember,
	RideParticipant,
};
