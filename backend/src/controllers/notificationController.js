exports.listNotifications = async (_req, res) => {
	return res.status(200).json({ success: true, data: { notifications: [] } });
};

exports.markAsRead = async (req, res) => {
	return res.status(200).json({
		success: true,
		data: { notificationId: req.params.notificationId, isRead: true },
	});
};

exports.markAllAsRead = async (_req, res) => {
	return res.status(200).json({ success: true, data: { markedAllRead: true } });
};
