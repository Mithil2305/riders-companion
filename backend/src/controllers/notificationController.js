const { Notification } = require("../models");
const { DevicePushToken } = require("../models");
const { formatError } = require("../utils/errorFormatter");

exports.listNotifications = async (req, res) => {
	const rows = await Notification.findAll({
		where: { rider_id: req.user.id },
		order: [["created_at", "DESC"]],
		limit: 100,
	});

	const notifications = rows.map((row) => ({
		id: row.id,
		title: row.title,
		body: row.body,
		type: row.type,
		read: Boolean(row.read_at),
		createdAt: row.created_at,
		entityType: row.entity_type,
		entityId: row.entity_id,
		metadata: row.metadata || {},
	}));

	return res.status(200).json({ success: true, data: { notifications } });
};

exports.markAsRead = async (req, res) => {
	const notification = await Notification.findOne({
		where: {
			id: req.params.notificationId,
			rider_id: req.user.id,
		},
	});

	if (!notification) {
		return formatError(
			res,
			404,
			"Notification not found",
			"NOTIFICATION_NOT_FOUND",
		);
	}

	notification.read_at = notification.read_at || new Date();
	await notification.save();

	return res.status(200).json({
		success: true,
		data: { notificationId: req.params.notificationId, isRead: true },
	});
};

exports.markAllAsRead = async (req, res) => {
	await Notification.update(
		{ read_at: new Date() },
		{
			where: {
				rider_id: req.user.id,
				read_at: null,
			},
		},
	);

	return res.status(200).json({ success: true, data: { markedAllRead: true } });
};

exports.registerPushToken = async (req, res) => {
	const token = typeof req.body.token === "string" ? req.body.token.trim() : "";
	const platform =
		typeof req.body.platform === "string" && req.body.platform.trim().length > 0
			? req.body.platform.trim().toLowerCase()
			: "unknown";

	if (!token || !token.startsWith("ExponentPushToken[")) {
		return formatError(
			res,
			400,
			"Valid Expo push token is required",
			"PUSH_TOKEN_INVALID",
		);
	}

	const [entry] = await DevicePushToken.findOrCreate({
		where: { token },
		defaults: {
			rider_id: req.user.id,
			platform,
			token,
			last_seen_at: new Date(),
		},
	});

	if (entry.rider_id !== req.user.id || entry.platform !== platform) {
		entry.rider_id = req.user.id;
		entry.platform = platform;
		entry.last_seen_at = new Date();
		await entry.save();
	}

	return res.status(200).json({
		success: true,
		data: {
			registered: true,
			token: entry.token,
		},
	});
};
