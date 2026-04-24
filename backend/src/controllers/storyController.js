const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");
const { canCreateContentOrRide } = require("../utils/profileAccess");
const { FeedPost } = require("../models");

exports.listStories = async (req, res) => {
	const stories = await FeedPost.findAll({
		where: { rider_id: req.user.id, media_type: "STORY" },
		order: [["created_at", "DESC"]],
		limit: 100,
	});

	return res.status(200).json({ success: true, data: { stories } });
};

exports.createStory = async (req, res) => {
	try {
		if (!canCreateContentOrRide(req.user)) {
			return formatError(
				res,
				403,
				"Please complete your profile before posting stories",
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
				"videoBase64",
				"videoUrl",
			],
			mimeTypeKey: "mediaMimeType",
			folder: `feed/${req.user.id}/stories`,
			fallbackMimeType: "application/octet-stream",
		});

		const mediaUrl = uploadedMedia?.url || req.body.mediaUrl || null;

		const createdStory = await FeedPost.create({
			rider_id: req.user.id,
			caption: typeof req.body.caption === "string" ? req.body.caption : null,
			media_url: mediaUrl,
			media_type: "STORY",
		});

		return res.status(201).json({
			success: true,
			data: {
				message: "Story created",
				story: createdStory,
				payload: {
					...req.body,
					mediaUrl,
				},
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "STORY_MEDIA_UPLOAD_ERR");
		}

		return formatError(res, 500, "Failed to create story", "STORY_CREATE_ERR");
	}
};
