const express = require("express");
const rideController = require("../controllers/rideController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/friends", requireAuth, rideController.listFriends);
router.get("/community", requireAuth, rideController.getCommunityRides);
router.post("/", requireAuth, rideController.createRide);
router.patch("/:rideId", requireAuth, rideController.updateRide);
router.delete("/:rideId", requireAuth, rideController.deleteRide);
router.post(
	"/:rideId/invitations/accept",
	requireAuth,
	rideController.acceptInvitation,
);
router.post(
	"/:rideId/invitations/decline",
	requireAuth,
	rideController.declineInvitation,
);
router.get("/:rideId", requireAuth, rideController.getRideById);
router.post("/:rideId/join", requireAuth, rideController.joinRide);
router.post("/:rideId/leave", requireAuth, rideController.leaveRide);
router.post("/:rideId/invite", requireAuth, rideController.inviteRiders);
router.post("/:rideId/start", requireAuth, rideController.startRide);
router.post("/:rideId/end", requireAuth, rideController.endRide);
router.get("/:rideId/snapshot", requireAuth, rideController.getRideSnapshot);
router.post("/:rideId/location", requireAuth, rideController.updateLocation);
router.get("/:rideId/locations", requireAuth, rideController.getRideLocations);
router.patch(
	"/:rideId/participants/me/status",
	requireAuth,
	rideController.updateParticipantStatus,
);
router.get("/:rideId/reports", requireAuth, rideController.getRideReports);

module.exports = router;
