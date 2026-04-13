exports.getMyProfile = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: {
			profile: {
				id: req.user?.id,
				email: req.user?.email,
				username: req.user?.username,
				name: req.user?.name,
			},
		},
	});
};

exports.updateMyProfile = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: {
			message: "Profile update route",
			payload: req.body,
		},
	});
};

exports.getGarageBikes = async (_req, res) => {
	return res.status(200).json({ success: true, data: { bikes: [] } });
};

exports.addGarageBike = async (req, res) => {
	return res.status(201).json({
		success: true,
		data: {
			message: "Bike add route",
			payload: req.body,
		},
	});
};

exports.updateGarageBike = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: {
			bikeId: req.params.bikeId,
			payload: req.body,
		},
	});
};

exports.deleteGarageBike = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { bikeId: req.params.bikeId, deleted: true },
	});
};
