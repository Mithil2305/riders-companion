const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");
const { canCreateContentOrRide } = require("../utils/profileAccess");

exports.listClips = async (_req, res) => {
	return res.status(200).json({ success: true, data: { clips: [] } });
};

exports.createClip = async (req, res) => {
	try {
		if (!canCreateContentOrRide(req.user)) {
			return formatError(
				res,
				403,
				"Please complete your profile before posting clips",
				"PROFILE_SETUP_REQUIRED",
			);
		}

		const uploadedMedia = await uploadMediaFromBody(req.body, {
			inputKeys: [
				"videoData",
				"videoBase64",
				"videoUrl",
				"mediaData",
				"mediaBase64",
			],
			mimeTypeKey: "mediaMimeType",
			folder: "clips",
			fallbackMimeType: "video/mp4",
		});

		return res.status(201).json({
			success: true,
			data: {
				message: "Clip created route",
				payload: {
					...req.body,
					videoUrl: uploadedMedia?.url || req.body.videoUrl || null,
				},
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "CLIP_MEDIA_UPLOAD_ERR");
		}

		return formatError(res, 500, "Failed to create clip", "CLIP_CREATE_ERR");
	}
};

exports.getClipById = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { clipId: req.params.clipId } });
};
