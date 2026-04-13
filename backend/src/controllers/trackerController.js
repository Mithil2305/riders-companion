exports.getFollowers = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { riderId: req.params.riderId, followers: [] },
	});
};

exports.getFollowing = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { riderId: req.params.riderId, following: [] },
	});
};

exports.followRider = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { riderId: req.params.riderId, following: true },
	});
};

exports.unfollowRider = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { riderId: req.params.riderId, following: false },
	});
};
