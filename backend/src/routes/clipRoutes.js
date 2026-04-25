const express = require("express");
const clipController = require("../controllers/clipController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/", requireAuth, clipController.listClips);
router.post("/", requireAuth, clipController.createClip);
router.get("/:clipId", requireAuth, clipController.getClipById);
router.patch("/:clipId", requireAuth, clipController.updateClip);
router.delete("/:clipId", requireAuth, clipController.deleteClip);
router.get("/:clipId/comments", requireAuth, clipController.getClipComments);
router.post("/:clipId/comments", requireAuth, clipController.addClipComment);
router.patch(
	"/:clipId/comments/:commentId",
	requireAuth,
	clipController.updateClipComment,
);
router.delete(
	"/:clipId/comments/:commentId",
	requireAuth,
	clipController.deleteClipComment,
);
router.post("/:clipId/likes", requireAuth, clipController.likeClip);
router.delete("/:clipId/likes", requireAuth, clipController.unlikeClip);

module.exports = router;
