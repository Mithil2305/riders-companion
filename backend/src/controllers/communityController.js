const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");

exports.listCommunities = async (_req, res) => {
	return res.status(200).json({ success: true, data: { communities: [] } });
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
