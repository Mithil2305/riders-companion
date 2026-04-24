const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");
const { canCreateContentOrRide } = require("../utils/profileAccess");
const { Clip, ClipComment, ClipLike, RiderAccount } = require("../models");

const toClipPayload = async (clip, viewerId) => {
	const [likesCount, commentsCount, likedRecord] = await Promise.all([
		ClipLike.count({ where: { clip_id: clip.id } }),
		ClipComment.count({ where: { clip_id: clip.id } }),
		ClipLike.findOne({
			where: { clip_id: clip.id, rider_id: viewerId },
			attributes: ["id"],
		}),
	]);

	return {
		id: clip.id,
		videoUrl: clip.video_url,
		songId: clip.song_id,
		createdAt: clip.created_at,
		rider: {
			id: clip.RiderAccount?.id,
			name: clip.RiderAccount?.name,
			username: clip.RiderAccount?.username,
			profileImageUrl: clip.RiderAccount?.profile_image_url,
		},
		likesCount,
		commentsCount,
		sharesCount: 0,
		likedByMe: Boolean(likedRecord),
	};
};

const validateCommentText = (value) => {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (trimmed.length === 0) {
		return null;
	}

	if (trimmed.length > 2000) {
		return null;
	}

	return trimmed;
};

exports.listClips = async (req, res) => {
	try {
		const clips = await Clip.findAll({
			include: [
				{
					model: RiderAccount,
					attributes: ["id", "name", "username", "profile_image_url"],
				},
			],
			order: [["created_at", "DESC"]],
			limit: 100,
		});

		const payloadClips = await Promise.all(
			clips.map((clip) => toClipPayload(clip, req.user.id)),
		);

		return res.status(200).json({
			success: true,
			data: { clips: payloadClips },
		});
	} catch (_error) {
		return formatError(res, 500, "Failed to load clips", "CLIP_FETCH_ERR");
	}
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
			folder: `feed/${req.user.id}/videos`,
			fallbackMimeType: "video/mp4",
		});

		const videoUrl = uploadedMedia?.url || req.body.videoUrl || null;

		const createdClip = await Clip.create({
			rider_id: req.user.id,
			video_url: videoUrl,
			song_id:
				typeof req.body.songId === "string"
					? req.body.songId
					: typeof req.body.song_id === "string"
						? req.body.song_id
						: null,
		});

		return res.status(201).json({
			success: true,
			data: {
				message: "Clip created",
				clip: createdClip,
				payload: {
					...req.body,
					videoUrl,
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
	const clip = await Clip.findByPk(req.params.clipId, {
		include: [
			{
				model: RiderAccount,
				attributes: ["id", "name", "username", "profile_image_url"],
			},
		],
	});

	if (!clip) {
		return formatError(res, 404, "Clip not found", "CLIP_NOT_FOUND");
	}

	const payloadClip = await toClipPayload(clip, req.user.id);
	return res.status(200).json({ success: true, data: { clip: payloadClip } });
};

exports.getClipComments = async (req, res) => {
	const clip = await Clip.findByPk(req.params.clipId, { attributes: ["id"] });

	if (!clip) {
		return formatError(res, 404, "Clip not found", "CLIP_NOT_FOUND");
	}

	const comments = await ClipComment.findAll({
		where: { clip_id: clip.id },
		include: [
			{
				model: RiderAccount,
				attributes: ["id", "name", "username", "profile_image_url"],
			},
		],
		order: [["created_at", "DESC"]],
		limit: 100,
	});

	return res.status(200).json({
		success: true,
		data: {
			clipId: clip.id,
			comments: comments.map((comment) => ({
				id: comment.id,
				commentText: comment.comment_text,
				createdAt: comment.created_at,
				rider: {
					id: comment.RiderAccount?.id,
					name: comment.RiderAccount?.name,
					username: comment.RiderAccount?.username,
					profileImageUrl: comment.RiderAccount?.profile_image_url,
				},
			})),
		},
	});
};

exports.addClipComment = async (req, res) => {
	const clip = await Clip.findByPk(req.params.clipId, { attributes: ["id"] });

	if (!clip) {
		return formatError(res, 404, "Clip not found", "CLIP_NOT_FOUND");
	}

	const commentText = validateCommentText(req.body.commentText);
	if (!commentText) {
		return formatError(
			res,
			400,
			"commentText must be 1-2000 characters",
			"CLIP_COMMENT_INVALID",
		);
	}

	const createdComment = await ClipComment.create({
		clip_id: clip.id,
		rider_id: req.user.id,
		comment_text: commentText,
	});

	const commentsCount = await ClipComment.count({
		where: { clip_id: clip.id },
	});

	return res.status(201).json({
		success: true,
		data: {
			clipId: clip.id,
			comment: {
				id: createdComment.id,
				commentText: createdComment.comment_text,
				createdAt: createdComment.created_at,
			},
			commentsCount,
		},
	});
};

exports.likeClip = async (req, res) => {
	const clip = await Clip.findByPk(req.params.clipId, { attributes: ["id"] });

	if (!clip) {
		return formatError(res, 404, "Clip not found", "CLIP_NOT_FOUND");
	}

	await ClipLike.findOrCreate({
		where: { clip_id: clip.id, rider_id: req.user.id },
		defaults: { clip_id: clip.id, rider_id: req.user.id },
	});

	const likesCount = await ClipLike.count({ where: { clip_id: clip.id } });

	return res.status(200).json({
		success: true,
		data: { clipId: clip.id, liked: true, likesCount },
	});
};

exports.unlikeClip = async (req, res) => {
	const clip = await Clip.findByPk(req.params.clipId, { attributes: ["id"] });

	if (!clip) {
		return formatError(res, 404, "Clip not found", "CLIP_NOT_FOUND");
	}

	await ClipLike.destroy({
		where: { clip_id: clip.id, rider_id: req.user.id },
	});

	const likesCount = await ClipLike.count({ where: { clip_id: clip.id } });

	return res.status(200).json({
		success: true,
		data: { clipId: clip.id, liked: false, likesCount },
	});
};
