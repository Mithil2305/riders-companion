const express = require("express");
const clipController = require("../controllers/clipController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/", requireAuth, clipController.listClips);
router.post("/", requireAuth, clipController.createClip);
router.get("/:clipId", requireAuth, clipController.getClipById);

module.exports = router;
