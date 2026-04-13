const express = require("express");
const rideController = require("../controllers/rideController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.post("/", requireAuth, rideController.createRide);
router.get("/:rideId", requireAuth, rideController.getRideById);
router.post("/:rideId/join", requireAuth, rideController.joinRide);
router.post("/:rideId/leave", requireAuth, rideController.leaveRide);
router.post("/:rideId/start", requireAuth, rideController.startRide);
router.post("/:rideId/end", requireAuth, rideController.endRide);
router.patch(
	"/:rideId/participants/me/status",
	requireAuth,
	rideController.updateParticipantStatus,
);
router.get("/:rideId/reports", requireAuth, rideController.getRideReports);

module.exports = router;
