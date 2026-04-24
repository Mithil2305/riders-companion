const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");
const { canCreateContentOrRide } = require("../utils/profileAccess");
const {
	FeedPost,
	FeedPostComment,
	FeedPostCommentLike,
	FeedPostLike,
	RiderAccount,
} = require("../models");
const {
	createNotifications,
	notifyFollowersAboutPost,
} = require("../services/notificationService");

const detectMediaType = (mimeType = "") => {
	if (typeof mimeType !== "string") {
		return "TEXT";
	}

	if (/^video\//i.test(mimeType)) {
		return "VIDEO";
	}

	if (/^image\//i.test(mimeType)) {
		return "IMAGE";
	}

	return "TEXT";
};

const toFeedPostPayload = async (post, viewerId) => {
	const [likesCount, commentsCount, likedRecord] = await Promise.all([
		FeedPostLike.count({ where: { feed_post_id: post.id } }),
		FeedPostComment.count({ where: { feed_post_id: post.id } }),
		FeedPostLike.findOne({
			where: { feed_post_id: post.id, rider_id: viewerId },
			attributes: ["id"],
		}),
	]);

	return {
		id: post.id,
		caption: post.caption,
		mediaUrl: post.media_url,
		mediaType: post.media_type,
		createdAt: post.created_at,
		rider: {
			id: post.RiderAccount?.id,
			name: post.RiderAccount?.name,
			username: post.RiderAccount?.username,
			profileImageUrl: post.RiderAccount?.profile_image_url,
		},
		likesCount,
		commentsCount,
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

const toCommentPayload = async (comment, viewerId) => {
	const [likesCount, likedRecord] = await Promise.all([
		FeedPostCommentLike.count({
			where: { feed_post_comment_id: comment.id },
		}),
		FeedPostCommentLike.findOne({
			where: { feed_post_comment_id: comment.id, rider_id: viewerId },
			attributes: ["id"],
		}),
	]);

	return {
		id: comment.id,
		commentText: comment.comment_text,
		createdAt: comment.created_at,
		rider: {
			id: comment.RiderAccount?.id,
			name: comment.RiderAccount?.name,
			username: comment.RiderAccount?.username,
			profileImageUrl: comment.RiderAccount?.profile_image_url,
		},
		likesCount,
		likedByMe: Boolean(likedRecord),
	};
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

exports.getHomeFeed = async (req, res) => {
	try {
		const posts = await FeedPost.findAll({
			include: [
				{
					model: RiderAccount,
					attributes: ["id", "name", "username", "profile_image_url"],
				},
			],
			order: [["created_at", "DESC"]],
			limit: 100,
		});

		const payloadPosts = await Promise.all(
			posts.map((post) => toFeedPostPayload(post, req.user.id)),
		);

		return res.status(200).json({
			success: true,
			data: { posts: payloadPosts },
		});
	} catch (_error) {
		return formatError(res, 500, "Failed to load home feed", "FEED_FETCH_ERR");
	}
};

exports.getPostById = async (req, res) => {
	const post = await FeedPost.findByPk(req.params.postId, {
		include: [
			{
				model: RiderAccount,
				attributes: ["id", "name", "username", "profile_image_url"],
			},
		],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	const payloadPost = await toFeedPostPayload(post, req.user.id);
	return res.status(200).json({ success: true, data: { post: payloadPost } });
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
			folder: ({ mimeType }) =>
				`feed/${req.user.id}/${/^video\//i.test(mimeType || "") ? "videos" : "photos"}`,
			fallbackMimeType: "application/octet-stream",
		});

		const payload = {
			...req.body,
			mediaUrl: uploadedMedia?.url || req.body.mediaUrl || null,
		};

		const createdPost = await FeedPost.create({
			rider_id: req.user.id,
			caption: typeof req.body.caption === "string" ? req.body.caption : null,
			media_url: payload.mediaUrl,
			media_type: detectMediaType(req.body.mediaMimeType),
		});

		await notifyFollowersAboutPost({
			actorId: req.user.id,
			postId: createdPost.id,
			caption: createdPost.caption,
		});

		return res.status(201).json({
			success: true,
			data: {
				message: "Feed post created",
				post: createdPost,
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
	const post = await FeedPost.findByPk(req.params.postId, {
		attributes: ["id"],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	const comments = await FeedPostComment.findAll({
		where: { feed_post_id: post.id },
		include: [
			{
				model: RiderAccount,
				attributes: ["id", "name", "username", "profile_image_url"],
			},
		],
		order: [["created_at", "DESC"]],
		limit: 100,
	});
	const payloadComments = await Promise.all(
		comments.map((comment) => toCommentPayload(comment, req.user.id)),
	);

	return res.status(200).json({
		success: true,
		data: {
			postId: post.id,
			comments: payloadComments,
		},
	});
};

exports.addComment = async (req, res) => {
	const post = await FeedPost.findByPk(req.params.postId, {
		attributes: ["id", "rider_id", "caption"],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	const commentText = validateCommentText(req.body.commentText);
	if (!commentText) {
		return formatError(
			res,
			400,
			"commentText must be 1-2000 characters",
			"FEED_COMMENT_INVALID",
		);
	}

	const createdComment = await FeedPostComment.create({
		feed_post_id: post.id,
		rider_id: req.user.id,
		comment_text: commentText,
	});

	if (post.rider_id && post.rider_id !== req.user.id) {
		const actor = await RiderAccount.findByPk(req.user.id, {
			attributes: ["name", "username"],
		});

		const actorName = actor?.username
			? `@${actor.username}`
			: actor?.name || "A rider";

		await createNotifications({
			recipientIds: [post.rider_id],
			actorId: req.user.id,
			type: "POST_COMMENTED",
			title: `${actorName} commented on your post`,
			body: commentText,
			entityType: "feed_post",
			entityId: post.id,
			metadata: {
				postId: post.id,
				commentId: createdComment.id,
			},
		});
	}

	const commentsCount = await FeedPostComment.count({
		where: { feed_post_id: post.id },
	});
	const commentWithRider = await FeedPostComment.findByPk(createdComment.id, {
		include: [
			{
				model: RiderAccount,
				attributes: ["id", "name", "username", "profile_image_url"],
			},
		],
	});

	return res.status(201).json({
		success: true,
		data: {
			postId: post.id,
			comment: commentWithRider
				? await toCommentPayload(commentWithRider, req.user.id)
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

exports.likeComment = async (req, res) => {
	const post = await FeedPost.findByPk(req.params.postId, {
		attributes: ["id"],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	const comment = await FeedPostComment.findOne({
		where: {
			id: req.params.commentId,
			feed_post_id: post.id,
		},
		attributes: ["id", "feed_post_id"],
	});

	if (!comment) {
		return formatError(res, 404, "Comment not found", "FEED_COMMENT_NOT_FOUND");
	}

	await FeedPostCommentLike.findOrCreate({
		where: {
			feed_post_comment_id: comment.id,
			rider_id: req.user.id,
		},
		defaults: {
			feed_post_id: post.id,
			feed_post_comment_id: comment.id,
			rider_id: req.user.id,
		},
	});

	const likesCount = await FeedPostCommentLike.count({
		where: { feed_post_comment_id: comment.id },
	});

	return res.status(200).json({
		success: true,
		data: { commentId: comment.id, liked: true, likesCount },
	});
};

exports.unlikeComment = async (req, res) => {
	const post = await FeedPost.findByPk(req.params.postId, {
		attributes: ["id"],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	const comment = await FeedPostComment.findOne({
		where: {
			id: req.params.commentId,
			feed_post_id: post.id,
		},
		attributes: ["id"],
	});

	if (!comment) {
		return formatError(res, 404, "Comment not found", "FEED_COMMENT_NOT_FOUND");
	}

	await FeedPostCommentLike.destroy({
		where: {
			feed_post_comment_id: comment.id,
			rider_id: req.user.id,
		},
	});

	const likesCount = await FeedPostCommentLike.count({
		where: { feed_post_comment_id: comment.id },
	});

	return res.status(200).json({
		success: true,
		data: { commentId: comment.id, liked: false, likesCount },
	});
};

exports.likePost = async (req, res) => {
	const post = await FeedPost.findByPk(req.params.postId, {
		attributes: ["id"],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	await FeedPostLike.findOrCreate({
		where: {
			feed_post_id: post.id,
			rider_id: req.user.id,
		},
		defaults: {
			feed_post_id: post.id,
			rider_id: req.user.id,
		},
	});

	const likesCount = await FeedPostLike.count({
		where: { feed_post_id: post.id },
	});

	return res.status(200).json({
		success: true,
		data: { postId: post.id, liked: true, likesCount },
	});
};

exports.unlikePost = async (req, res) => {
	const post = await FeedPost.findByPk(req.params.postId, {
		attributes: ["id"],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	await FeedPostLike.destroy({
		where: {
			feed_post_id: post.id,
			rider_id: req.user.id,
		},
	});

	const likesCount = await FeedPostLike.count({
		where: { feed_post_id: post.id },
	});

	return res.status(200).json({
		success: true,
		data: { postId: post.id, liked: false, likesCount },
	});
};

exports.updatePost = async (req, res) => {
	const post = await FeedPost.findByPk(req.params.postId, {
		include: [
			{
				model: RiderAccount,
				attributes: ["id", "name", "username", "profile_image_url"],
			},
		],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	if (post.rider_id !== req.user.id) {
		return formatError(
			res,
			403,
			"You can only edit your own posts",
			"FEED_POST_EDIT_FORBIDDEN",
		);
	}

	const nextCaption = normalizeCaption(req.body.caption);
	if (nextCaption === null) {
		return formatError(
			res,
			400,
			"caption must be a string up to 2000 characters",
			"FEED_CAPTION_INVALID",
		);
	}

	post.caption = nextCaption.length > 0 ? nextCaption : null;
	await post.save();

	const payloadPost = await toFeedPostPayload(post, req.user.id);
	return res.status(200).json({
		success: true,
		data: { message: "Post updated", post: payloadPost },
	});
};

exports.deletePost = async (req, res) => {
	const post = await FeedPost.findByPk(req.params.postId, {
		attributes: ["id", "rider_id"],
	});

	if (!post) {
		return formatError(res, 404, "Post not found", "FEED_POST_NOT_FOUND");
	}

	if (post.rider_id !== req.user.id) {
		return formatError(
			res,
			403,
			"You can only delete your own posts",
			"FEED_POST_DELETE_FORBIDDEN",
		);
	}

	await Promise.all([
		FeedPostLike.destroy({ where: { feed_post_id: post.id } }),
		FeedPostCommentLike.destroy({ where: { feed_post_id: post.id } }),
		FeedPostComment.destroy({ where: { feed_post_id: post.id } }),
	]);

	await post.destroy();

	return res.status(200).json({
		success: true,
		data: { message: "Post deleted", postId: req.params.postId },
	});
};
