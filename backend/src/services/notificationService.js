const { Op } = require("sequelize");
const {
	DevicePushToken,
	Notification,
	RiderAccount,
	Tracker,
} = require("../models");
const websocketHub = require("../websockets/hub");

const EXPO_PUSH_ENDPOINT = "https://exp.host/--/api/v2/push/send";

const mapNotificationPayload = (entry) => ({
	id: entry.id,
	type: entry.type,
	title: entry.title,
	body: entry.body,
	entityType: entry.entity_type,
	entityId: entry.entity_id,
	metadata: entry.metadata || {},
	createdAt: entry.created_at,
	read: Boolean(entry.read_at),
});

const sendExpoPushBatch = async (messages) => {
	if (!Array.isArray(messages) || messages.length === 0) {
		return;
	}

	try {
		await fetch(EXPO_PUSH_ENDPOINT, {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
				Accept: "application/json",
			},
			body: JSON.stringify(messages),
		});
	} catch (error) {
		console.error("Expo push send failed", error);
	}
};

const sendPushToRecipients = async ({ recipientIds, title, body, data }) => {
	if (!Array.isArray(recipientIds) || recipientIds.length === 0) {
		return;
	}

	const tokens = await DevicePushToken.findAll({
		where: {
			rider_id: { [Op.in]: recipientIds },
		},
		attributes: ["token"],
	});

	const uniqueTokens = Array.from(
		new Set(tokens.map((row) => row.token).filter(Boolean)),
	);

	if (uniqueTokens.length === 0) {
		return;
	}

	const messages = uniqueTokens.map((token) => ({
		to: token,
		sound: "default",
		title,
		body,
		data,
	}));

	for (let i = 0; i < messages.length; i += 100) {
		await sendExpoPushBatch(messages.slice(i, i + 100));
	}
};

const notifyFollowersAboutPost = async ({ actorId, postId, caption }) => {
	const links = await Tracker.findAll({
		where: { following_id: actorId },
		attributes: ["follower_id"],
	});

	const recipientIds = links
		.map((item) => item.follower_id)
		.filter((id) => id && id !== actorId);

	if (recipientIds.length === 0) {
		return;
	}

	const actor = await RiderAccount.findByPk(actorId, {
		attributes: ["name", "username"],
	});

	const actorName = actor?.username
		? `@${actor.username}`
		: actor?.name || "A rider";
	const trimmedCaption = typeof caption === "string" ? caption.trim() : "";

	await createNotifications({
		recipientIds,
		actorId,
		type: "FOLLOWING_POSTED",
		title: `${actorName} posted a new ride moment`,
		body: trimmedCaption.length > 0 ? trimmedCaption : "Tap to view the post.",
		entityType: "feed_post",
		entityId: postId,
		metadata: { postId },
	});
};

const createNotifications = async ({
	recipientIds,
	actorId,
	type,
	title,
	body,
	entityType,
	entityId,
	metadata = {},
}) => {
	const dedupedRecipients = Array.from(
		new Set(
			(recipientIds || []).filter(
				(id) => typeof id === "string" && id.length > 0,
			),
		),
	);

	if (dedupedRecipients.length === 0) {
		return [];
	}

	const createdRows = await Notification.bulkCreate(
		dedupedRecipients.map((riderId) => ({
			rider_id: riderId,
			actor_id: actorId || null,
			type,
			title,
			body,
			entity_type: entityType || null,
			entity_id: entityId || null,
			metadata,
		})),
		{ returning: true },
	);

	for (const row of createdRows) {
		websocketHub.sendToRider(row.rider_id, "NOTIFICATION_EVENT", {
			notification: mapNotificationPayload(row),
		});
	}

	await sendPushToRecipients({
		recipientIds: dedupedRecipients,
		title,
		body,
		data: {
			type,
			entityType: entityType || null,
			entityId: entityId || null,
			...metadata,
		},
	});

	return createdRows;
};

module.exports = {
	createNotifications,
	notifyFollowersAboutPost,
};
