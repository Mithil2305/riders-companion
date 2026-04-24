const express = require("express");
const communityController = require("../controllers/communityController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/", requireAuth, communityController.listCommunities);
router.post("/", requireAuth, communityController.createCommunity);
router.get("/:communityId", requireAuth, communityController.getCommunityById);
router.post(
	"/:communityId/join",
	requireAuth,
	communityController.joinCommunity,
);
router.post(
	"/:communityId/leave",
	requireAuth,
	communityController.leaveCommunity,
);
router.get(
	"/:communityId/members",
	requireAuth,
	communityController.getMembers,
);

module.exports = router;
