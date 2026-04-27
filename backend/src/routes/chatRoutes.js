const express = require("express");
const chatController = require("../controllers/chatController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

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
