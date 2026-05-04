const express = require("express");
const chatController = require("../controllers/chatController");
const requireAuth = require("../middlewares/requireAuth");
const { formatError } = require("../utils/errorFormatter");

const router = express.Router();

const isUuid = (value) =>
	typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);

router.param("roomId", (req, res, next, roomId) => {
	if (!isUuid(roomId)) {
		return formatError(res, 400, "Invalid roomId", "CHAT_ROOM_INVALID");
	}

	return next();
});

router.param("riderId", (req, res, next, riderId) => {
	if (!isUuid(riderId)) {
		return formatError(res, 400, "Invalid riderId", "CHAT_RIDER_INVALID");
	}

	return next();
});

router.get("/personal", requireAuth, chatController.listPersonalConversations);
router.get("/personal/blocked", requireAuth, chatController.listBlockedUsers);
router.get(
	"/personal/:riderId",
	requireAuth,
	chatController.getPersonalConversation,
);
router.post(
	"/personal/:riderId/messages",
	requireAuth,
	chatController.sendPersonalMessage,
);
router.post(
	"/personal/:riderId/block",
	requireAuth,
	chatController.blockPersonalUser,
);
router.delete(
	"/personal/:riderId/block",
	requireAuth,
	chatController.unblockPersonalUser,
);
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

// Group chat invitations
router.get(
	"/invitations",
	requireAuth,
	chatController.listGroupChatInvitations,
);
router.post(
	"/invitations/:invitationId/accept",
	requireAuth,
	chatController.acceptGroupChatInvitation,
);
router.post(
	"/invitations/:invitationId/decline",
	requireAuth,
	chatController.declineGroupChatInvitation,
);
router.post(
	"/communities/:communityId/invite",
	requireAuth,
	chatController.inviteUserToGroupChat,
);

module.exports = router;
