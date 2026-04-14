const express = require("express");
const trackerController = require("../controllers/trackerController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/followers/:riderId", requireAuth, trackerController.getFollowers);
router.get("/following/:riderId", requireAuth, trackerController.getFollowing);
router.post("/:riderId/follow", requireAuth, trackerController.followRider);
router.delete("/:riderId/follow", requireAuth, trackerController.unfollowRider);

module.exports = router;
