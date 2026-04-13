exports.listCommunities = async (_req, res) => {
	return res.status(200).json({ success: true, data: { communities: [] } });
};

exports.createCommunity = async (req, res) => {
	return res.status(201).json({
		success: true,
		data: {
			message: "Community created route",
			payload: req.body,
		},
	});
};

exports.getCommunityById = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { communityId: req.params.communityId } });
};

exports.joinCommunity = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { communityId: req.params.communityId, joined: true },
	});
};

exports.leaveCommunity = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { communityId: req.params.communityId, joined: false },
	});
};

exports.getMembers = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { communityId: req.params.communityId, members: [] },
	});
};
