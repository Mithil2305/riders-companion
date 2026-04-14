const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");
const { canCreateContentOrRide } = require("../utils/profileAccess");

exports.getHomeFeed = async (_req, res) => {
	return res.status(200).json({ success: true, data: { posts: [] } });
};

exports.getPostById = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { postId: req.params.postId } });
};

exports.createPost = async (req, res) => {
	try {
		if (!canCreateContentOrRide(req.user)) {
			return formatError(
				res,
				403,
				"Please complete your profile before creating a post",
				"PROFILE_SETUP_REQUIRED",
			);
		}

		const uploadedMedia = await uploadMediaFromBody(req.body, {
			inputKeys: [
				"mediaData",
				"mediaBase64",
				"mediaUrl",
				"imageBase64",
				"imageUrl",
			],
			mimeTypeKey: "mediaMimeType",
			folder: "feed",
			fallbackMimeType: "application/octet-stream",
		});

		const payload = {
			...req.body,
			mediaUrl: uploadedMedia?.url || req.body.mediaUrl || null,
		};

		return res.status(201).json({
			success: true,
			data: {
				message: "Feed post route created",
				payload,
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "FEED_MEDIA_UPLOAD_ERR");
		}

		return formatError(res, 500, "Failed to create post", "FEED_CREATE_ERR");
	}
};

exports.getComments = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { postId: req.params.postId, comments: [] } });
};

exports.addComment = async (req, res) => {
	return res.status(201).json({
		success: true,
		data: {
			postId: req.params.postId,
			commentText: req.body.commentText,
		},
	});
};

exports.likePost = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { postId: req.params.postId, liked: true } });
};

exports.unlikePost = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { postId: req.params.postId, liked: false } });
};
