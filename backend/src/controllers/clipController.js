exports.listClips = async (_req, res) => {
	return res.status(200).json({ success: true, data: { clips: [] } });
};

exports.createClip = async (req, res) => {
	return res.status(201).json({
		success: true,
		data: {
			message: "Clip created route",
			payload: req.body,
		},
	});
};

exports.getClipById = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { clipId: req.params.clipId } });
};
