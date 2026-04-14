const { formatError } = require("../utils/errorFormatter");
const { mediaUploadError, uploadMediaFromBody } = require("../utils/mediaUpload");

exports.getRoomMessages = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: {
			roomId: req.params.roomId,
			messages: [],
		},
	});
};

exports.sendRoomMessage = async (req, res) => {
	try {
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

		return res.status(201).json({
			success: true,
			data: {
				roomId: req.params.roomId,
				encryptedPayload: req.body.encryptedPayload,
				iv: req.body.iv,
				attachmentUrl: attachment?.url || null,
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "CHAT_MEDIA_UPLOAD_ERR");
		}

		return formatError(res, 500, "Failed to send message", "CHAT_SEND_ERR");
	}
};
