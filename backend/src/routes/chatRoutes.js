const express = require("express");
const chatController = require("../controllers/chatController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get(
	"/rooms/:roomId/messages",
	requireAuth,
	chatController.getRoomMessages,
);
router.post(
	"/rooms/:roomId/messages",
	requireAuth,
	chatController.sendRoomMessage,
);

module.exports = router;
