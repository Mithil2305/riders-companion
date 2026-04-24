const express = require("express");
const storyController = require("../controllers/storyController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/", requireAuth, storyController.listStories);
router.post("/", requireAuth, storyController.createStory);

module.exports = router;
