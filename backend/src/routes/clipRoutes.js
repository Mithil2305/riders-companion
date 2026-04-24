const express = require("express");
const clipController = require("../controllers/clipController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/", requireAuth, clipController.listClips);
router.post("/", requireAuth, clipController.createClip);
router.get("/:clipId", requireAuth, clipController.getClipById);
router.get("/:clipId/comments", requireAuth, clipController.getClipComments);
router.post("/:clipId/comments", requireAuth, clipController.addClipComment);
router.post("/:clipId/likes", requireAuth, clipController.likeClip);
router.delete("/:clipId/likes", requireAuth, clipController.unlikeClip);

module.exports = router;
