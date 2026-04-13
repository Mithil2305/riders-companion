const express = require("express");
const feedController = require("../controllers/feedController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/", requireAuth, feedController.getHomeFeed);
router.post("/", requireAuth, feedController.createPost);
router.get("/:postId", requireAuth, feedController.getPostById);
router.get("/:postId/comments", requireAuth, feedController.getComments);
router.post("/:postId/comments", requireAuth, feedController.addComment);
router.post("/:postId/likes", requireAuth, feedController.likePost);
router.delete("/:postId/likes", requireAuth, feedController.unlikePost);

module.exports = router;
