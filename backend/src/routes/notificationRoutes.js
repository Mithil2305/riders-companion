const express = require("express");
const notificationController = require("../controllers/notificationController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/", requireAuth, notificationController.listNotifications);
router.post(
	"/push-token",
	requireAuth,
	notificationController.registerPushToken,
);
router.patch(
	"/:notificationId/read",
	requireAuth,
	notificationController.markAsRead,
);
router.patch("/read-all", requireAuth, notificationController.markAllAsRead);

module.exports = router;
