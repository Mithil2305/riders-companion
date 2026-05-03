<<<<<<< HEAD
const { Op } = require("sequelize");
const { Community, CommunityMember } = require("../models");
=======
<<<<<<< HEAD
=======
const { Op } = require("sequelize");
const { Community, CommunityMember } = require("../models");
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");

<<<<<<< HEAD
=======
<<<<<<< HEAD
exports.listCommunities = async (_req, res) => {
	return res.status(200).json({ success: true, data: { communities: [] } });
=======
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
exports.listCommunities = async (req, res) => {
	try {
		const memberships = await CommunityMember.findAll({
			where: { rider_id: req.user.id },
			attributes: ["community_id"],
		});

		const memberIds = memberships.map((item) => item.community_id);
		const communities = await Community.findAll({
			where: {
				[Op.or]: [{ id: { [Op.in]: memberIds } }, { creator_id: req.user.id }],
			},
			attributes: ["id", "name"],
			order: [["created_at", "DESC"]],
		});

		return res.status(200).json({
			success: true,
			data: {
				communities: communities.map((community) => ({
					id: community.id,
					name: community.name,
				})),
			},
		});
	} catch {
		return formatError(
			res,
			500,
			"Failed to load communities",
			"COMMUNITY_LIST_ERR",
		);
	}
<<<<<<< HEAD
=======
>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
>>>>>>> f6515781ad9de8db79994bdc067ba0a02e47799f
};

exports.createCommunity = async (req, res) => {
	try {
		const communityImage = await uploadMediaFromBody(req.body, {
			inputKeys: [
				"communityImageData",
				"communityImageBase64",
				"communityImageUrl",
				"imageData",
				"imageBase64",
				"imageUrl",
			],
			mimeTypeKey: "communityImageMimeType",
			folder: "communities",
			fallbackMimeType: "image/jpeg",
		});

		return res.status(201).json({
			success: true,
			data: {
				message: "Community created route",
				payload: {
					...req.body,
					communityImageUrl:
						communityImage?.url || req.body.communityImageUrl || null,
				},
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "COMMUNITY_MEDIA_UPLOAD_ERR");
		}

		return formatError(
			res,
			500,
			"Failed to create community",
			"COMMUNITY_CREATE_ERR",
		);
	}
};

exports.getCommunityById = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { communityId: req.params.communityId } });
};

exports.joinCommunity = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { communityId: req.params.communityId, joined: true },
	});
};

exports.leaveCommunity = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { communityId: req.params.communityId, joined: false },
	});
};

exports.getMembers = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { communityId: req.params.communityId, members: [] },
	});
};
