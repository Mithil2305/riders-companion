const { Op } = require("sequelize");
const { Tracker, RiderAccount } = require("../models");
const { formatError } = require("../utils/errorFormatter");

const mapTrackerUser = (row, currentFollowingSet) => ({
	id: row.id,
	name: row.name || row.username || "Rider",
	avatar: row.profile_image_url || "",
	isFollowing: currentFollowingSet.has(row.id),
});

const getFollowingSetForViewer = async (viewerId) => {
	const links = await Tracker.findAll({
		where: { follower_id: viewerId },
		attributes: ["following_id"],
	});

	return new Set(links.map((item) => item.following_id).filter(Boolean));
};

exports.getFollowers = async (req, res) => {
	const riderId = req.params.riderId;

	const links = await Tracker.findAll({
		where: { following_id: riderId },
		attributes: ["follower_id"],
	});

	const ids = links.map((item) => item.follower_id).filter(Boolean);
	if (ids.length === 0) {
		return res.status(200).json({
			success: true,
			data: { riderId, followers: [] },
		});
	}

	const [followers, viewerFollowingSet] = await Promise.all([
		RiderAccount.findAll({
			where: { id: { [Op.in]: ids } },
			attributes: ["id", "name", "username", "profile_image_url"],
		}),
		getFollowingSetForViewer(req.user.id),
	]);

	return res.status(200).json({
		success: true,
		data: {
			riderId,
			followers: followers.map((item) =>
				mapTrackerUser(item, viewerFollowingSet),
			),
		},
	});
};

exports.getFollowing = async (req, res) => {
	const riderId = req.params.riderId;

	const links = await Tracker.findAll({
		where: { follower_id: riderId },
		attributes: ["following_id"],
	});

	const ids = links.map((item) => item.following_id).filter(Boolean);
	if (ids.length === 0) {
		return res.status(200).json({
			success: true,
			data: { riderId, following: [] },
		});
	}

	const [following, viewerFollowingSet] = await Promise.all([
		RiderAccount.findAll({
			where: { id: { [Op.in]: ids } },
			attributes: ["id", "name", "username", "profile_image_url"],
		}),
		getFollowingSetForViewer(req.user.id),
	]);

	return res.status(200).json({
		success: true,
		data: {
			riderId,
			following: following.map((item) =>
				mapTrackerUser(item, viewerFollowingSet),
			),
		},
	});
};

exports.followRider = async (req, res) => {
	const targetRiderId = req.params.riderId;
	if (targetRiderId === req.user.id) {
		return formatError(
			res,
			400,
			"You cannot follow yourself",
			"TRACKER_SELF_FOLLOW",
		);
	}

	const target = await RiderAccount.findByPk(targetRiderId, {
		attributes: ["id"],
	});
	if (!target) {
		return formatError(res, 404, "Rider not found", "TRACKER_RIDER_NOT_FOUND");
	}

	await Tracker.findOrCreate({
		where: {
			follower_id: req.user.id,
			following_id: targetRiderId,
		},
		defaults: {
			follower_id: req.user.id,
			following_id: targetRiderId,
		},
	});

	return res.status(200).json({
		success: true,
		data: { riderId: targetRiderId, following: true },
	});
};

exports.unfollowRider = async (req, res) => {
	const targetRiderId = req.params.riderId;

	await Tracker.destroy({
		where: {
			follower_id: req.user.id,
			following_id: targetRiderId,
		},
	});

	return res.status(200).json({
		success: true,
		data: { riderId: targetRiderId, following: false },
	});
};
