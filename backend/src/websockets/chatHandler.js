const { UserEncryptedChat } = require("../models");
const chatCryptoService = require("../services/chatCryptoService");

const CHAT_EVENTS = new Set([
	"CHAT_JOIN_ROOM",
	"CHAT_LEAVE_ROOM",
	"CHAT_TYPING",
	"CHAT_SEND_MESSAGE",
]);

const ensureRoomSet = (chatRooms, roomId) => {
	if (!chatRooms.has(roomId)) {
		chatRooms.set(roomId, new Set());
	}
	return chatRooms.get(roomId);
};

const broadcastToRoom = ({
	state,
	roomId,
	type,
	payload,
	sendToSocket,
	exclude,
}) => {
	const roomSockets = state.chatRooms.get(roomId);
	if (!roomSockets || roomSockets.size === 0) {
		return;
	}

	for (const socket of roomSockets) {
		if (exclude && socket === exclude) {
			continue;
		}

		sendToSocket(socket, type, payload);
	}
};

const joinRoom = ({ ws, payload, state, sendToSocket, sendError }) => {
	const roomId = payload?.roomId;
	if (!roomId || typeof roomId !== "string") {
		sendError(ws, "CHAT_JOIN_BAD_PAYLOAD", "roomId is required");
		return true;
	}

	const roomSet = ensureRoomSet(state.chatRooms, roomId);
	roomSet.add(ws);
	ws.chatRooms.add(roomId);

	sendToSocket(ws, "CHAT_ROOM_JOINED", {
		roomId,
		riderId: ws.rider.id,
	});

	broadcastToRoom({
		state,
		roomId,
		type: "CHAT_PRESENCE",
		payload: {
			roomId,
			riderId: ws.rider.id,
			name: ws.rider.name,
			username: ws.rider.username,
			state: "online",
		},
		sendToSocket,
		exclude: ws,
	});

	return true;
};

const leaveRoom = ({ ws, payload, state, sendToSocket, sendError }) => {
	const roomId = payload?.roomId;
	if (!roomId || typeof roomId !== "string") {
		sendError(ws, "CHAT_LEAVE_BAD_PAYLOAD", "roomId is required");
		return true;
	}

	const roomSet = state.chatRooms.get(roomId);
	if (roomSet) {
		roomSet.delete(ws);
		if (roomSet.size === 0) {
			state.chatRooms.delete(roomId);
		}
	}

	ws.chatRooms.delete(roomId);

	broadcastToRoom({
		state,
		roomId,
		type: "CHAT_PRESENCE",
		payload: {
			roomId,
			riderId: ws.rider.id,
			state: "offline",
		},
		sendToSocket,
		exclude: ws,
	});

	sendToSocket(ws, "CHAT_ROOM_LEFT", { roomId });
	return true;
};

const handleTyping = ({ ws, payload, state, sendToSocket, sendError }) => {
	const roomId = payload?.roomId;
	const isTyping = Boolean(payload?.isTyping);

	if (!roomId || typeof roomId !== "string") {
		sendError(ws, "CHAT_TYPING_BAD_PAYLOAD", "roomId is required");
		return true;
	}

	if (!ws.chatRooms.has(roomId)) {
		sendError(
			ws,
			"CHAT_ROOM_REQUIRED",
			"Join room before sending typing events",
			{
				roomId,
			},
		);
		return true;
	}

	broadcastToRoom({
		state,
		roomId,
		type: "CHAT_TYPING",
		payload: {
			roomId,
			riderId: ws.rider.id,
			name: ws.rider.name,
			isTyping,
			updatedAt: new Date().toISOString(),
		},
		sendToSocket,
		exclude: ws,
	});

	return true;
};

const sendMessage = async ({ ws, payload, state, sendToSocket, sendError }) => {
	const roomId = payload?.roomId;
	const messageText =
		typeof payload?.message === "string"
			? payload.message
			: payload?.encryptedPayload;
	const receiverId =
		typeof payload?.receiverId === "string" ? payload.receiverId : null;
	const attachmentUrl =
		typeof payload?.attachmentUrl === "string" ? payload.attachmentUrl : null;

	if (!roomId || typeof roomId !== "string") {
		sendError(ws, "CHAT_SEND_BAD_PAYLOAD", "roomId is required");
		return true;
	}

	if (typeof messageText !== "string" || messageText.trim().length === 0) {
		sendError(ws, "CHAT_SEND_BAD_PAYLOAD", "message is required");
		return true;
	}

	if (!ws.chatRooms.has(roomId)) {
		const roomSet = ensureRoomSet(state.chatRooms, roomId);
		roomSet.add(ws);
		ws.chatRooms.add(roomId);
	}

	let encrypted;
	try {
		encrypted = chatCryptoService.encryptMessage({
			plainText: messageText,
			roomId,
			senderId: ws.rider.id,
			receiverId,
		});
	} catch (error) {
		sendError(
			ws,
			"CHAT_CRYPTO_ERR",
			error instanceof Error ? error.message : "Failed to encrypt message",
		);
		return true;
	}

	const saved = await UserEncryptedChat.create({
		sender_id: ws.rider.id,
		receiver_id: receiverId,
		room_id: roomId,
		encrypted_payload: encrypted.encryptedPayload,
		iv: encrypted.iv,
	});

	let decryptedText;
	try {
		decryptedText = chatCryptoService.decryptMessage({
			encryptedPayload: saved.encrypted_payload,
			iv: saved.iv,
			roomId,
			senderId: ws.rider.id,
			receiverId,
		});
	} catch (_error) {
		sendError(ws, "CHAT_CRYPTO_ERR", "Failed to decrypt message after save");
		return true;
	}

	const messagePayload = {
		id: saved.id,
		roomId,
		senderId: ws.rider.id,
		senderName: ws.rider.name,
		encryptedPayload: saved.encrypted_payload,
		iv: saved.iv,
		message: decryptedText,
		receiverId,
		attachmentUrl,
		createdAt: saved.created_at,
	};

	if (receiverId) {
		const roomSockets = state.chatRooms.get(roomId);
		if (roomSockets) {
			for (const socket of roomSockets) {
				if (!socket?.rider?.id) {
					continue;
				}

				if (socket.rider.id === ws.rider.id || socket.rider.id === receiverId) {
					sendToSocket(socket, "CHAT_MESSAGE", messagePayload);
				}
			}
		}
	} else {
		broadcastToRoom({
			state,
			roomId,
			type: "CHAT_MESSAGE",
			payload: messagePayload,
			sendToSocket,
		});
	}

	sendToSocket(ws, "CHAT_MESSAGE_ACK", {
		roomId,
		messageId: saved.id,
		createdAt: saved.created_at,
	});

	return true;
};

exports.handleMessage = async ({
	ws,
	type,
	payload,
	state,
	sendToSocket,
	sendError,
}) => {
	if (!CHAT_EVENTS.has(type)) {
		return false;
	}

	if (type === "CHAT_JOIN_ROOM") {
		return joinRoom({ ws, payload, state, sendToSocket, sendError });
	}

	if (type === "CHAT_LEAVE_ROOM") {
		return leaveRoom({ ws, payload, state, sendToSocket, sendError });
	}

	if (type === "CHAT_TYPING") {
		return handleTyping({ ws, payload, state, sendToSocket, sendError });
	}

	if (type === "CHAT_SEND_MESSAGE") {
		return sendMessage({ ws, payload, state, sendToSocket, sendError });
	}

	return false;
};

exports.handleDisconnect = ({ ws, state, sendToSocket }) => {
	if (!ws || !ws.rider || !ws.chatRooms || ws.chatRooms.size === 0) {
		return;
	}

	for (const roomId of ws.chatRooms) {
		const roomSet = state.chatRooms.get(roomId);
		if (roomSet) {
			roomSet.delete(ws);
			if (roomSet.size === 0) {
				state.chatRooms.delete(roomId);
			}
		}

		broadcastToRoom({
			state,
			roomId,
			type: "CHAT_PRESENCE",
			payload: {
				roomId,
				riderId: ws.rider.id,
				state: "offline",
			},
			sendToSocket,
		});
	}

	ws.chatRooms.clear();
};
