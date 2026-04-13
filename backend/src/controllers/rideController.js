exports.createRide = async (req, res) => {
	return res.status(201).json({
		success: true,
		data: {
			message: "Ride created route",
			payload: req.body,
		},
	});
};

exports.getRideById = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { rideId: req.params.rideId } });
};

exports.joinRide = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { rideId: req.params.rideId, joined: true } });
};

exports.leaveRide = async (req, res) => {
	return res
		.status(200)
		.json({
			success: true,
			data: { rideId: req.params.rideId, joined: false },
		});
};

exports.startRide = async (req, res) => {
	return res
		.status(200)
		.json({
			success: true,
			data: { rideId: req.params.rideId, status: "ACTIVE" },
		});
};

exports.endRide = async (req, res) => {
	return res
		.status(200)
		.json({
			success: true,
			data: { rideId: req.params.rideId, status: "COMPLETED" },
		});
};

exports.updateParticipantStatus = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: {
			rideId: req.params.rideId,
			status: req.body.status,
			distance: req.body.distance,
		},
	});
};

exports.getRideReports = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { rideId: req.params.rideId, reports: [] } });
};
