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
	return res.status(201).json({
		success: true,
		data: {
			roomId: req.params.roomId,
			encryptedPayload: req.body.encryptedPayload,
			iv: req.body.iv,
		},
	});
};
