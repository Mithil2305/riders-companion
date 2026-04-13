const { formatError } = require("../utils/errorFormatter");

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
		return res.status(201).json({
			success: true,
			data: {
				message: "Feed post route created",
				payload: req.body,
			},
		});
	} catch (_error) {
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
