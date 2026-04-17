const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");
const { UserEncryptedChat } = require("../models");
const chatCryptoService = require("../services/chatCryptoService");

const toClientMessage = (record, currentUserId) => {
	const senderId = record.sender_id;
	const receiverId = record.receiver_id || null;
	const roomId = record.room_id;

	if (
		receiverId &&
		senderId !== currentUserId &&
		receiverId !== currentUserId
	) {
		return null;
	}

	let message;
	try {
		message = chatCryptoService.decryptMessage({
			encryptedPayload: record.encrypted_payload,
			iv: record.iv,
			roomId,
			senderId,
			receiverId,
		});
	} catch (_error) {
		return {
			id: record.id,
			roomId,
			senderId,
			receiverId,
			message: "[message unavailable]",
			decryptionFailed: true,
			createdAt: record.created_at,
		};
	}

	return {
		id: record.id,
		roomId,
		senderId,
		receiverId,
		message,
		createdAt: record.created_at,
	};
};

exports.getRoomMessages = async (req, res) => {
	try {
		const roomId = req.params.roomId;
		const riderId = req.user.id;

		const records = await UserEncryptedChat.findAll({
			where: { room_id: roomId },
			order: [["created_at", "ASC"]],
			limit: 200,
		});

		const messages = records
			.map((entry) => toClientMessage(entry, riderId))
			.filter(Boolean);

		return res.status(200).json({
			success: true,
			data: {
				roomId,
				messages,
			},
		});
	} catch (_error) {
		return formatError(
			res,
			500,
			"Failed to fetch room messages",
			"CHAT_FETCH_ERR",
		);
	}
};

exports.sendRoomMessage = async (req, res) => {
	try {
		const roomId = req.params.roomId;
		const senderId = req.user.id;
		const receiverId =
			typeof req.body.receiverId === "string" ? req.body.receiverId : null;
		const plainTextInput =
			typeof req.body.message === "string"
				? req.body.message
				: req.body.encryptedPayload;

		if (
			typeof plainTextInput !== "string" ||
			plainTextInput.trim().length === 0
		) {
			return formatError(
				res,
				400,
				"Message text is required",
				"CHAT_SEND_BAD_PAYLOAD",
			);
		}

		const attachment = await uploadMediaFromBody(req.body, {
			inputKeys: [
				"attachmentData",
				"attachmentBase64",
				"attachmentUrl",
				"audioData",
				"audioBase64",
				"audioUrl",
				"imageData",
				"imageBase64",
				"imageUrl",
				"videoData",
				"videoBase64",
				"videoUrl",
			],
			mimeTypeKey: "attachmentMimeType",
			folder: "chat",
			fallbackMimeType: "application/octet-stream",
		});

		const encrypted = chatCryptoService.encryptMessage({
			plainText: plainTextInput,
			roomId,
			senderId,
			receiverId,
		});

		const saved = await UserEncryptedChat.create({
			sender_id: senderId,
			receiver_id: receiverId,
			room_id: roomId,
			encrypted_payload: encrypted.encryptedPayload,
			iv: encrypted.iv,
		});

		return res.status(201).json({
			success: true,
			data: {
				id: saved.id,
				roomId,
				senderId,
				receiverId,
				message: plainTextInput.trim(),
				attachmentUrl: attachment?.url || null,
				createdAt: saved.created_at,
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "CHAT_MEDIA_UPLOAD_ERR");
		}

		if (
			error instanceof Error &&
			/CHAT_AUTH_ID|AUTH_ID|encrypt|decrypt|Message/i.test(error.message)
		) {
			return formatError(res, 400, error.message, "CHAT_CRYPTO_ERR");
		}

		return formatError(res, 500, "Failed to send message", "CHAT_SEND_ERR");
	}
};
