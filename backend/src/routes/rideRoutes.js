const express = require("express");
const rideController = require("../controllers/rideController");
const requireAuth = require("../middlewares/requireAuth");
const { formatError } = require("../utils/errorFormatter");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Rides
 *   description: Motorcycle ride management and tracking
 */

const isUuid = (value) =>
	typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);

router.param("rideId", (req, res, next, rideId) => {
	if (!isUuid(rideId)) {
		return formatError(res, 400, "Invalid rideId", "RIDE_INVALID_ID");
	}

	return next();
});

/**
 * @swagger
 * /rides/friends:
 *   get:
 *     summary: Get friends' rides
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of friends' rides
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ride'
 *       401:
 *         description: Unauthorized
 */
router.get("/friends", requireAuth, rideController.listFriends);
router.get("/community", requireAuth, rideController.getCommunityRides);
/**
 * @swagger
 * /rides:
 *   post:
 *     summary: Create a new ride
 *     tags: [Rides]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Ride'
 *     responses:
 *       201:
 *         description: Ride created successfully
 *       401:
 *         description: Unauthorized
 */
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
