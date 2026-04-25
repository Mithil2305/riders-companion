const express = require("express");
const feedController = require("../controllers/feedController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/", requireAuth, feedController.getHomeFeed);
router.post("/", requireAuth, feedController.createPost);
router.get("/:postId", requireAuth, feedController.getPostById);
router.patch("/:postId", requireAuth, feedController.updatePost);
router.delete("/:postId", requireAuth, feedController.deletePost);
router.get("/:postId/comments", requireAuth, feedController.getComments);
router.post("/:postId/comments", requireAuth, feedController.addComment);
router.patch(
	"/:postId/comments/:commentId",
	requireAuth,
	feedController.updateComment,
);
router.delete(
	"/:postId/comments/:commentId",
	requireAuth,
	feedController.deleteComment,
);
router.post(
	"/:postId/comments/:commentId/likes",
	requireAuth,
	feedController.likeComment,
);
router.delete(
	"/:postId/comments/:commentId/likes",
	requireAuth,
	feedController.unlikeComment,
);
router.post("/:postId/likes", requireAuth, feedController.likePost);
router.delete("/:postId/likes", requireAuth, feedController.unlikePost);

module.exports = router;
