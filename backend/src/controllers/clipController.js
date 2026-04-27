const { Op, fn, col } = require("sequelize");
const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");
const { canCreateContentOrRide } = require("../utils/profileAccess");
const { Clip, ClipComment, ClipLike, RiderAccount } = require("../models");

const toClipPayload = (clip, stats = {}) => {
	return {
		id: clip.id,
		videoUrl: clip.video_url,
		caption: clip.caption,
		songId: clip.song_id,
		thumbnailUrl: clip.thumbnail_url,
		createdAt: clip.created_at,
		rider: {
			id: clip.RiderAccount?.id,
			name: clip.RiderAccount?.name,
			username: clip.RiderAccount?.username,
			profileImageUrl: clip.RiderAccount?.profile_image_url,
		},
		likesCount: Number(stats.likesCount ?? 0),
		commentsCount: Number(stats.commentsCount ?? 0),
		sharesCount: 0,
		likedByMe: Boolean(stats.likedByMe),
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

const normalizeCaption = (value) => {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (trimmed.length > 2000) {
		return null;
	}

	return trimmed.length === 0 ? "" : trimmed;
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

		const clipIds = clips.map((clip) => clip.id);
		const [likeCounts, commentCounts, likedRows] = await Promise.all([
			clipIds.length === 0
				? []
				: ClipLike.findAll({
						attributes: ["clip_id", [fn("COUNT", col("id")), "count"]],
						where: { clip_id: { [Op.in]: clipIds } },
						group: ["clip_id"],
				  }),
			clipIds.length === 0
				? []
				: ClipComment.findAll({
						attributes: ["clip_id", [fn("COUNT", col("id")), "count"]],
						where: { clip_id: { [Op.in]: clipIds } },
						group: ["clip_id"],
				  }),
			clipIds.length === 0
				? []
				: ClipLike.findAll({
						attributes: ["clip_id"],
						where: {
							clip_id: { [Op.in]: clipIds },
							rider_id: req.user.id,
						},
				  }),
		]);

		const likeCountByClipId = new Map(
			likeCounts.map((row) => [row.clip_id, Number(row.get("count") ?? 0)]),
		);
		const commentCountByClipId = new Map(
			commentCounts.map((row) => [row.clip_id, Number(row.get("count") ?? 0)]),
		);
		const likedClipIds = new Set(likedRows.map((row) => row.clip_id));

		const payloadClips = clips.map((clip) =>
			toClipPayload(clip, {
				likesCount: likeCountByClipId.get(clip.id) ?? 0,
				commentsCount: commentCountByClipId.get(clip.id) ?? 0,
				likedByMe: likedClipIds.has(clip.id),
			}),
		);

		return res.status(200).json({
			success: true,
			data: { clips: payloadClips },
		});
	} catch (error) {
		console.error("Failed to load clips:", error);
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
			videoCompressionProfile: "clip-fast",
		});

		const videoUrl = uploadedMedia?.url || req.body.videoUrl || null;
		const thumbnailUrl = uploadedMedia?.thumbnailUrl || null;

		const createdClip = await Clip.create({
			rider_id: req.user.id,
			video_url: videoUrl,
			thumbnail_url: thumbnailUrl,
			caption: typeof req.body.caption === "string" ? req.body.caption : null,
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
					thumbnailUrl,
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

	const [likesCount, commentsCount, likedRecord] = await Promise.all([
		ClipLike.count({ where: { clip_id: clip.id } }),
		ClipComment.count({ where: { clip_id: clip.id } }),
		ClipLike.findOne({
			where: { clip_id: clip.id, rider_id: req.user.id },
			attributes: ["id"],
		}),
	]);
	const payloadClip = toClipPayload(clip, {
		likesCount,
		commentsCount,
		likedByMe: Boolean(likedRecord),
	});
	return res.status(200).json({ success: true, data: { clip: payloadClip } });
};

exports.updateClip = async (req, res) => {
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

	if (clip.rider_id !== req.user.id) {
		return formatError(
			res,
			403,
			"You can only edit your own clips",
			"CLIP_EDIT_FORBIDDEN",
		);
	}

	const nextCaption = normalizeCaption(req.body.caption);
	if (nextCaption === null) {
		return formatError(
			res,
			400,
			"caption must be a string up to 2000 characters",
			"CLIP_CAPTION_INVALID",
		);
	}

	clip.caption = nextCaption.length > 0 ? nextCaption : null;
	await clip.save();

	return res.status(200).json({
		success: true,
		data: {
			message: "Clip updated",
			clip: toClipPayload(clip, {
				likesCount: await ClipLike.count({ where: { clip_id: clip.id } }),
				commentsCount: await ClipComment.count({ where: { clip_id: clip.id } }),
				likedByMe: Boolean(
					await ClipLike.findOne({
						where: { clip_id: clip.id, rider_id: req.user.id },
						attributes: ["id"],
					}),
				),
			}),
		},
	});
};

exports.deleteClip = async (req, res) => {
	const clip = await Clip.findByPk(req.params.clipId, {
		attributes: ["id", "rider_id"],
	});

	if (!clip) {
		return formatError(res, 404, "Clip not found", "CLIP_NOT_FOUND");
	}

	if (clip.rider_id !== req.user.id) {
		return formatError(
			res,
			403,
			"You can only delete your own clips",
			"CLIP_DELETE_FORBIDDEN",
		);
	}

	await Promise.all([
		ClipLike.destroy({ where: { clip_id: clip.id } }),
		ClipComment.destroy({ where: { clip_id: clip.id } }),
	]);

	await clip.destroy();

	return res.status(200).json({
		success: true,
		data: { message: "Clip deleted", clipId: req.params.clipId },
	});
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
				likesCount: 0,
				likedByMe: false,
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

	const commentWithRider = await ClipComment.findByPk(createdComment.id, {
		include: [
			{
				model: RiderAccount,
				attributes: ["id", "name", "username", "profile_image_url"],
			},
		],
	});

	const commentsCount = await ClipComment.count({
		where: { clip_id: clip.id },
	});

	return res.status(201).json({
		success: true,
		data: {
			clipId: clip.id,
			comment: commentWithRider
				? {
						id: commentWithRider.id,
						commentText: commentWithRider.comment_text,
						createdAt: commentWithRider.created_at,
						likesCount: 0,
						likedByMe: false,
						rider: {
							id: commentWithRider.RiderAccount?.id,
							name: commentWithRider.RiderAccount?.name,
							username: commentWithRider.RiderAccount?.username,
							profileImageUrl:
								commentWithRider.RiderAccount?.profile_image_url,
						},
					}
				: {
						id: createdComment.id,
						commentText: createdComment.comment_text,
						createdAt: createdComment.created_at,
						likesCount: 0,
						likedByMe: false,
					},
			commentsCount,
		},
	});
};

exports.updateClipComment = async (req, res) => {
	const clip = await Clip.findByPk(req.params.clipId, { attributes: ["id"] });

	if (!clip) {
		return formatError(res, 404, "Clip not found", "CLIP_NOT_FOUND");
	}

	const comment = await ClipComment.findOne({
		where: {
			id: req.params.commentId,
			clip_id: clip.id,
		},
		include: [
			{
				model: RiderAccount,
				attributes: ["id", "name", "username", "profile_image_url"],
			},
		],
	});

	if (!comment) {
		return formatError(res, 404, "Comment not found", "CLIP_COMMENT_NOT_FOUND");
	}

	if (comment.rider_id !== req.user.id) {
		return formatError(
			res,
			403,
			"You can only edit your own comments",
			"CLIP_COMMENT_EDIT_FORBIDDEN",
		);
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

	comment.comment_text = commentText;
	await comment.save();

	return res.status(200).json({
		success: true,
		data: {
			clipId: clip.id,
			comment: {
				id: comment.id,
				commentText: comment.comment_text,
				createdAt: comment.created_at,
				likesCount: 0,
				likedByMe: false,
				rider: {
					id: comment.RiderAccount?.id,
					name: comment.RiderAccount?.name,
					username: comment.RiderAccount?.username,
					profileImageUrl: comment.RiderAccount?.profile_image_url,
				},
			},
		},
	});
};

exports.deleteClipComment = async (req, res) => {
	const clip = await Clip.findByPk(req.params.clipId, { attributes: ["id"] });

	if (!clip) {
		return formatError(res, 404, "Clip not found", "CLIP_NOT_FOUND");
	}

	const comment = await ClipComment.findOne({
		where: {
			id: req.params.commentId,
			clip_id: clip.id,
		},
		attributes: ["id", "rider_id"],
	});

	if (!comment) {
		return formatError(res, 404, "Comment not found", "CLIP_COMMENT_NOT_FOUND");
	}

	if (comment.rider_id !== req.user.id) {
		return formatError(
			res,
			403,
			"You can only delete your own comments",
			"CLIP_COMMENT_DELETE_FORBIDDEN",
		);
	}

	await comment.destroy();

	const commentsCount = await ClipComment.count({
		where: { clip_id: clip.id },
	});

	return res.status(200).json({
		success: true,
		data: {
			clipId: clip.id,
			commentId: comment.id,
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
