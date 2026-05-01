const { Op } = require("sequelize");
const { formatError } = require("../utils/errorFormatter");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");
const {
	Friend,
	RiderAccount,
	UserEncryptedChat,
	GroupChatInvitation,
	Community,
	CommunityMember,
	Ride,
	RideParticipant,
} = require("../models");
const chatCryptoService = require("../services/chatCryptoService");
const { createNotifications } = require("../services/notificationService");
const websocketHub = require("../websockets/hub");

const toDirectRoomId = (leftRiderId, rightRiderId) =>
	`direct:${[leftRiderId, rightRiderId].sort().join(":")}`;

const isUuid = (value) =>
	typeof value === "string" && /^[0-9a-f-]{36}$/i.test(value);

const getDirectMessageWhere = (leftRiderId, rightRiderId) => ({
	[Op.or]: [
		{ sender_id: leftRiderId, receiver_id: rightRiderId },
		{ sender_id: rightRiderId, receiver_id: leftRiderId },
	],
});

const getBlockState = async (viewerId, otherRiderId) => {
	const row = await Friend.findOne({
		where: {
			status: "BLOCKED",
			[Op.or]: [
				{ user_id_1: viewerId, user_id_2: otherRiderId },
				{ user_id_1: otherRiderId, user_id_2: viewerId },
			],
		},
		order: [["created_at", "DESC"]],
	});

	if (!row) {
		return {
			blockedByViewer: false,
			blockedByOther: false,
			isBlocked: false,
		};
	}

	return {
		blockedByViewer: row.user_id_1 === viewerId,
		blockedByOther: row.user_id_1 === otherRiderId,
		isBlocked: true,
	};
};

const mapPersonalMeta = (rider, currentUserId, blockState) => ({
	roomId: rider.id,
	name: rider.username ? `@${rider.username}` : rider.name || "Rider",
	username: rider.username || null,
	avatar: rider.profile_image_url || null,
	isOnline: false,
	rideTogetherLabel: rider.username
		? `RIDER: @${rider.username}`
		: rider.name || "Rider",
	blockedByViewer: Boolean(blockState?.blockedByViewer),
	blockedByOther: Boolean(blockState?.blockedByOther),
	isBlocked: Boolean(blockState?.isBlocked),
	isSelf: rider.id === currentUserId,
});

const normalizePersonalMessageText = (message, attachmentUrl) => {
	if (attachmentUrl && message === "[image]") {
		return "";
	}

	return message;
};

const toClientMessage = (record, currentUserId, options = {}) => {
	const senderId = record.sender_id;
	const receiverId = record.receiver_id || null;
	const roomId =
		typeof options.roomId === "string" && options.roomId.length > 0
			? options.roomId
			: record.room_id;

	if (
		receiverId &&
		senderId !== currentUserId &&
		receiverId !== currentUserId
	) {
		return null;
	}

	let message;
	try {
		message = chatCryptoService.decryptMessage({
			encryptedPayload: record.encrypted_payload,
			iv: record.iv,
			roomId,
			senderId,
			receiverId,
		});
	} catch (_error) {
		return {
			id: record.id,
			roomId,
			senderId,
			receiverId,
			message: "[message unavailable]",
			decryptionFailed: true,
			createdAt: record.created_at,
			attachmentUrl: record.attachment_url || null,
			senderName: options.senderName || null,
			senderUsername: options.senderUsername || null,
		};
	}

	return {
		id: record.id,
		roomId,
		senderId,
		receiverId,
		message: normalizePersonalMessageText(message, record.attachment_url),
		createdAt: record.created_at,
		attachmentUrl: record.attachment_url || null,
		senderName: options.senderName || null,
		senderUsername: options.senderUsername || null,
	};
};

const loadSenderDirectory = async (records = []) => {
	const senderIds = Array.from(
		new Set(
			records
				.map((record) => record.sender_id)
				.filter((value) => typeof value === "string"),
		),
	);

	if (senderIds.length === 0) {
		return new Map();
	}

	const riders = await RiderAccount.findAll({
		where: { id: { [Op.in]: senderIds } },
		attributes: ["id", "name", "username", "profile_image_url"],
	});

	return new Map(riders.map((rider) => [rider.id, rider]));
};

const createStoredMessage = async ({
	senderId,
	receiverId,
	roomId,
	plainText,
	attachmentUrl,
}) => {
	const encrypted = chatCryptoService.encryptMessage({
		plainText,
		roomId,
		senderId,
		receiverId,
	});

	return UserEncryptedChat.create({
		sender_id: senderId,
		receiver_id: receiverId || null,
		room_id:
			typeof roomId === "string" && /^[0-9a-f-]{36}$/i.test(roomId)
				? roomId
				: null,
		encrypted_payload: encrypted.encryptedPayload,
		iv: encrypted.iv,
		attachment_url: attachmentUrl || null,
	});
};

const resolveRoomAccess = async ({ riderId, roomId }) => {
	if (typeof roomId !== "string" || roomId.trim().length === 0) {
		return {
			allowed: false,
			code: "CHAT_ROOM_REQUIRED",
			message: "roomId is required",
		};
	}

	if (roomId.startsWith("direct:")) {
		const roomMembers = roomId
			.slice("direct:".length)
			.split(":")
			.filter(Boolean);

		if (roomMembers.length !== 2 || !roomMembers.includes(riderId)) {
			return {
				allowed: false,
				code: "CHAT_ROOM_FORBIDDEN",
				message: "You do not have access to this direct chat",
			};
		}

		return {
			allowed: true,
			type: "direct",
		};
	}

	if (!isUuid(roomId)) {
		return {
			allowed: true,
			type: "generic",
		};
	}

	const ride = await Ride.findByPk(roomId, {
		attributes: ["id"],
	});

	if (!ride) {
		return {
			allowed: true,
			type: "generic",
		};
	}

	const participant = await RideParticipant.findOne({
		where: {
			ride_id: ride.id,
			rider_id: riderId,
			status: { [Op.notIn]: ["DECLINED"] },
		},
		attributes: ["rider_id"],
	});

	if (!participant) {
		return {
			allowed: false,
			code: "CHAT_ROOM_FORBIDDEN",
			message: "You are not allowed to access this ride chat",
		};
	}

	const participants = await RideParticipant.findAll({
		where: {
			ride_id: ride.id,
			status: { [Op.notIn]: ["DECLINED"] },
		},
		attributes: ["rider_id"],
	});

	return {
		allowed: true,
		type: "ride",
		rideId: ride.id,
		participantIds: participants
			.map((entry) => entry.rider_id)
			.filter((value) => typeof value === "string" && value.length > 0),
	};
};

const emitChatMessageToRiders = ({
	recipientIds,
	payload,
}) => {
	for (const riderId of recipientIds) {
		if (typeof riderId !== "string" || riderId.length === 0) {
			continue;
		}

		websocketHub.sendToRider(riderId, "CHAT_MESSAGE", payload);
	}
};

exports.listPersonalConversations = async (req, res) => {
	try {
		const riderId = req.user.id;
		const records = await UserEncryptedChat.findAll({
			where: {
				receiver_id: { [Op.ne]: null },
				[Op.or]: [{ sender_id: riderId }, { receiver_id: riderId }],
			},
			order: [["created_at", "DESC"]],
			limit: 500,
		});

		const latestByCounterpart = new Map();
		for (const record of records) {
			const counterpartId =
				record.sender_id === riderId ? record.receiver_id : record.sender_id;
			if (
				typeof counterpartId !== "string" ||
				counterpartId.length === 0 ||
				latestByCounterpart.has(counterpartId)
			) {
				continue;
			}

			latestByCounterpart.set(counterpartId, record);
		}

		const counterpartIds = Array.from(latestByCounterpart.keys());
		if (counterpartIds.length === 0) {
			return res.status(200).json({
				success: true,
				data: { conversations: [] },
			});
		}

		const [riders, blockRows] = await Promise.all([
			RiderAccount.findAll({
				where: { id: { [Op.in]: counterpartIds } },
				attributes: ["id", "name", "username", "profile_image_url"],
			}),
			Friend.findAll({
				where: {
					status: "BLOCKED",
					[Op.or]: [{ user_id_1: riderId }, { user_id_2: riderId }],
				},
			}),
		]);

		const riderMap = new Map(riders.map((rider) => [rider.id, rider]));
		const blockedByViewer = new Set(
			blockRows
				.filter((row) => row.user_id_1 === riderId)
				.map((row) => row.user_id_2),
		);
		const blockedByOther = new Set(
			blockRows
				.filter((row) => row.user_id_2 === riderId)
				.map((row) => row.user_id_1),
		);

		const conversations = counterpartIds
			.map((counterpartId) => {
				const rider = riderMap.get(counterpartId);
				const record = latestByCounterpart.get(counterpartId);

				if (!rider || !record) {
					return null;
				}

				const blockState = {
					blockedByViewer: blockedByViewer.has(counterpartId),
					blockedByOther: blockedByOther.has(counterpartId),
					isBlocked:
						blockedByViewer.has(counterpartId) ||
						blockedByOther.has(counterpartId),
				};
				const latestMessage = toClientMessage(record, riderId, {
					roomId: toDirectRoomId(riderId, counterpartId),
					senderName: riderMap.get(record.sender_id)?.name || null,
					senderUsername: riderMap.get(record.sender_id)?.username || null,
				});

				return {
					id: counterpartId,
					meta: mapPersonalMeta(rider, riderId, blockState),
					latestMessage,
				};
			})
			.filter(Boolean);

		return res.status(200).json({
			success: true,
			data: { conversations },
		});
	} catch (error) {
		console.error("Failed to list personal conversations:", error);
		return formatError(
			res,
			500,
			"Failed to load personal conversations",
			"CHAT_PERSONAL_LIST_ERR",
		);
	}
};

exports.listBlockedUsers = async (req, res) => {
	try {
		const rows = await Friend.findAll({
			where: {
				status: "BLOCKED",
				user_id_1: req.user.id,
			},
			order: [["created_at", "DESC"]],
		});

		const riderIds = rows.map((row) => row.user_id_2).filter(Boolean);
		if (riderIds.length === 0) {
			return res.status(200).json({
				success: true,
				data: { blockedUsers: [] },
			});
		}

		const riders = await RiderAccount.findAll({
			where: { id: { [Op.in]: riderIds } },
			attributes: ["id", "name", "username", "profile_image_url"],
		});
		const riderMap = new Map(riders.map((rider) => [rider.id, rider]));

		return res.status(200).json({
			success: true,
			data: {
				blockedUsers: riderIds
					.map((riderId) => riderMap.get(riderId))
					.filter(Boolean)
					.map((rider) => ({
						id: rider.id,
						meta: mapPersonalMeta(rider, req.user.id, {
							blockedByViewer: true,
							blockedByOther: false,
							isBlocked: true,
						}),
					})),
			},
		});
	} catch (error) {
		console.error("Failed to list blocked users:", error);
		return formatError(
			res,
			500,
			"Failed to load blocked users",
			"CHAT_BLOCK_LIST_ERR",
		);
	}
};

exports.getPersonalConversation = async (req, res) => {
	try {
		const riderId = req.user.id;
		const otherRiderId = req.params.riderId;

		const rider = await RiderAccount.findByPk(otherRiderId, {
			attributes: ["id", "name", "username", "profile_image_url"],
		});

		if (!rider) {
			return formatError(res, 404, "Rider not found", "CHAT_RIDER_NOT_FOUND");
		}

		const records = await UserEncryptedChat.findAll({
			where: getDirectMessageWhere(riderId, otherRiderId),
			order: [["created_at", "ASC"]],
			limit: 500,
		});
		const senderDirectory = await loadSenderDirectory(records);
		const blockState = await getBlockState(riderId, otherRiderId);
		const roomId = toDirectRoomId(riderId, otherRiderId);

		const messages = records
			.map((record) =>
				toClientMessage(record, riderId, {
					roomId,
					senderName: senderDirectory.get(record.sender_id)?.name || null,
					senderUsername:
						senderDirectory.get(record.sender_id)?.username || null,
				}),
			)
			.filter(Boolean);

		return res.status(200).json({
			success: true,
			data: {
				roomId: otherRiderId,
				meta: mapPersonalMeta(rider, riderId, blockState),
				messages,
			},
		});
	} catch (error) {
		console.error("Failed to load personal conversation:", error);
		return formatError(
			res,
			500,
			"Failed to load personal conversation",
			"CHAT_PERSONAL_FETCH_ERR",
		);
	}
};

exports.getRoomMessages = async (req, res) => {
	try {
		const roomId = req.params.roomId;
		const riderId = req.user.id;
		const access = await resolveRoomAccess({ riderId, roomId });

		if (!access.allowed) {
			return formatError(res, 403, access.message, access.code);
		}

		const records = await UserEncryptedChat.findAll({
			where: { room_id: roomId },
			order: [["created_at", "ASC"]],
			limit: 200,
		});
		const senderDirectory = await loadSenderDirectory(records);

		const messages = records
			.map((entry) =>
				toClientMessage(entry, riderId, {
					senderName: senderDirectory.get(entry.sender_id)?.name || null,
					senderUsername:
						senderDirectory.get(entry.sender_id)?.username || null,
				}),
			)
			.filter(Boolean);

		return res.status(200).json({
			success: true,
			data: {
				roomId,
				messages,
			},
		});
	} catch (_error) {
		return formatError(
			res,
			500,
			"Failed to fetch room messages",
			"CHAT_FETCH_ERR",
		);
	}
};

exports.sendPersonalMessage = async (req, res) => {
	try {
		const senderId = req.user.id;
		const receiverId = req.params.riderId;

		if (!receiverId || receiverId === senderId) {
			return formatError(
				res,
				400,
				"Valid receiver is required",
				"CHAT_PERSONAL_BAD_RECEIVER",
			);
		}

		const receiver = await RiderAccount.findByPk(receiverId, {
			attributes: ["id", "name", "username"],
		});
		if (!receiver) {
			return formatError(res, 404, "Rider not found", "CHAT_RIDER_NOT_FOUND");
		}

		const blockState = await getBlockState(senderId, receiverId);
		if (blockState.blockedByViewer) {
			return formatError(
				res,
				403,
				"Unblock this rider before sending messages",
				"CHAT_BLOCKED_BY_VIEWER",
			);
		}
		if (blockState.blockedByOther) {
			return formatError(
				res,
				403,
				"This rider has blocked you",
				"CHAT_BLOCKED_BY_OTHER",
			);
		}

		const attachment = await uploadMediaFromBody(req.body, {
			inputKeys: [
				"attachmentData",
				"attachmentBase64",
				"attachmentUrl",
				"imageData",
				"imageBase64",
				"imageUrl",
			],
			mimeTypeKey: "attachmentMimeType",
			folder: `feed/${req.user.id}/message-photos`,
			expiresInDays: 60,
			metadata: {
				autoDeleteAfterDays: 60,
				purpose: "chat-message-media",
			},
			fallbackMimeType: "image/jpeg",
		});

		const rawText =
			typeof req.body.message === "string"
				? req.body.message
				: typeof req.body.text === "string"
					? req.body.text
					: "";
		const normalizedText = rawText.trim();

		if (!normalizedText && !attachment?.url) {
			return formatError(
				res,
				400,
				"Message text is required",
				"CHAT_SEND_BAD_PAYLOAD",
			);
		}

		const storedText = normalizedText || "[image]";
		const roomId = toDirectRoomId(senderId, receiverId);
		const saved = await createStoredMessage({
			senderId,
			receiverId,
			roomId,
			plainText: storedText,
			attachmentUrl: attachment?.url || null,
		});

		const sender = await RiderAccount.findByPk(senderId, {
			attributes: ["name", "username"],
		});
		const senderName = sender?.username
			? `@${sender.username}`
			: sender?.name || "A rider";

		emitChatMessageToRiders({
			recipientIds: [receiverId],
			payload: {
				id: saved.id,
				roomId,
				senderId,
				receiverId,
				message: normalizedText,
				attachmentUrl: attachment?.url || null,
				createdAt: saved.created_at,
				senderName: sender?.name || "Rider",
				senderUsername: sender?.username || null,
			},
		});

		await createNotifications({
			recipientIds: [receiverId],
			actorId: senderId,
			type: "MESSAGE_RECEIVED",
			title: `${senderName} sent you a message`,
			body: normalizedText || "Sent you a photo",
			entityType: "chat_personal",
			entityId: receiverId,
			metadata: {
				riderId: senderId,
				messageId: saved.id,
			},
		});

		return res.status(201).json({
			success: true,
			data: {
				id: saved.id,
				roomId: receiverId,
				senderId,
				receiverId,
				message: normalizedText,
				attachmentUrl: attachment?.url || null,
				createdAt: saved.created_at,
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "CHAT_MEDIA_UPLOAD_ERR");
		}

		if (
			error instanceof Error &&
			/CHAT_AUTH_ID|AUTH_ID|encrypt|decrypt|Message/i.test(error.message)
		) {
			return formatError(res, 400, error.message, "CHAT_CRYPTO_ERR");
		}

		console.error("Failed to send personal message:", error);
		return formatError(
			res,
			500,
			"Failed to send personal message",
			"CHAT_PERSONAL_SEND_ERR",
		);
	}
};

exports.blockPersonalUser = async (req, res) => {
	try {
		const viewerId = req.user.id;
		const otherRiderId = req.params.riderId;

		if (!otherRiderId || otherRiderId === viewerId) {
			return formatError(
				res,
				400,
				"Valid rider is required",
				"CHAT_BLOCK_BAD_RIDER",
			);
		}

		const rider = await RiderAccount.findByPk(otherRiderId, {
			attributes: ["id"],
		});
		if (!rider) {
			return formatError(res, 404, "Rider not found", "CHAT_RIDER_NOT_FOUND");
		}

		await Friend.destroy({
			where: {
				status: "BLOCKED",
				[Op.or]: [
					{ user_id_1: viewerId, user_id_2: otherRiderId },
					{ user_id_1: otherRiderId, user_id_2: viewerId },
				],
			},
		});

		await Friend.create({
			user_id_1: viewerId,
			user_id_2: otherRiderId,
			status: "BLOCKED",
		});

		return res.status(200).json({
			success: true,
			data: { riderId: otherRiderId, blocked: true },
		});
	} catch (error) {
		console.error("Failed to block rider:", error);
		return formatError(res, 500, "Failed to block rider", "CHAT_BLOCK_ERR");
	}
};

exports.unblockPersonalUser = async (req, res) => {
	try {
		const viewerId = req.user.id;
		const otherRiderId = req.params.riderId;

		await Friend.destroy({
			where: {
				status: "BLOCKED",
				user_id_1: viewerId,
				user_id_2: otherRiderId,
			},
		});

		return res.status(200).json({
			success: true,
			data: { riderId: otherRiderId, blocked: false },
		});
	} catch (error) {
		console.error("Failed to unblock rider:", error);
		return formatError(res, 500, "Failed to unblock rider", "CHAT_UNBLOCK_ERR");
	}
};

exports.sendRoomMessage = async (req, res) => {
	try {
		const roomId = req.params.roomId;
		const senderId = req.user.id;
		const access = await resolveRoomAccess({ riderId: senderId, roomId });

		if (!access.allowed) {
			return formatError(res, 403, access.message, access.code);
		}

		const receiverId =
			typeof req.body.receiverId === "string" ? req.body.receiverId : null;
		const plainTextInput =
			typeof req.body.message === "string"
				? req.body.message
				: req.body.encryptedPayload;

		if (
			typeof plainTextInput !== "string" ||
			plainTextInput.trim().length === 0
		) {
			return formatError(
				res,
				400,
				"Message text is required",
				"CHAT_SEND_BAD_PAYLOAD",
			);
		}

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
			folder: `feed/${req.user.id}/message-photos`,
			expiresInDays: 60,
			metadata: {
				autoDeleteAfterDays: 60,
				purpose: "chat-message-media",
			},
			fallbackMimeType: "application/octet-stream",
		});

		const encrypted = chatCryptoService.encryptMessage({
			plainText: plainTextInput,
			roomId,
			senderId,
			receiverId,
		});

		const saved = await UserEncryptedChat.create({
			sender_id: senderId,
			receiver_id: receiverId,
			room_id: roomId,
			encrypted_payload: encrypted.encryptedPayload,
			iv: encrypted.iv,
			attachment_url: attachment?.url || null,
		});

		if (receiverId && receiverId !== senderId) {
			const sender = await RiderAccount.findByPk(senderId, {
				attributes: ["name", "username"],
			});

			const senderName = sender?.username
				? `@${sender.username}`
				: sender?.name || "A rider";

			await createNotifications({
				recipientIds: [receiverId],
				actorId: senderId,
				type: "MESSAGE_RECEIVED",
				title: `${senderName} sent you a message`,
				body: plainTextInput.trim().slice(0, 160),
				entityType: "chat_room",
				entityId: roomId,
				metadata: {
					roomId,
					messageId: saved.id,
				},
			});
		}

		const sender = await RiderAccount.findByPk(senderId, {
			attributes: ["name", "username"],
		});

		const messagePayload = {
			id: saved.id,
			roomId,
			senderId,
			receiverId,
			message: plainTextInput.trim(),
			attachmentUrl: attachment?.url || null,
			createdAt: saved.created_at,
			senderName: sender?.name || "Rider",
			senderUsername: sender?.username || null,
		};

		if (receiverId && receiverId !== senderId) {
			emitChatMessageToRiders({
				recipientIds: [receiverId],
				payload: messagePayload,
			});
		} else if (access.type === "ride") {
			emitChatMessageToRiders({
				recipientIds: access.participantIds.filter((id) => id !== senderId),
				payload: messagePayload,
			});
		}

		return res.status(201).json({
			success: true,
			data: {
				id: saved.id,
				roomId,
				senderId,
				receiverId,
				message: plainTextInput.trim(),
				attachmentUrl: attachment?.url || null,
				createdAt: saved.created_at,
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "CHAT_MEDIA_UPLOAD_ERR");
		}

		if (
			error instanceof Error &&
			/CHAT_AUTH_ID|AUTH_ID|encrypt|decrypt|Message/i.test(error.message)
		) {
			return formatError(res, 400, error.message, "CHAT_CRYPTO_ERR");
		}

		return formatError(res, 500, "Failed to send message", "CHAT_SEND_ERR");
	}
};

exports.listGroupChatInvitations = async (req, res) => {
	try {
		const riderId = req.user.id;

		const invitations = await GroupChatInvitation.findAll({
			where: {
				invited_rider_id: riderId,
				status: "PENDING",
			},
			include: [
				{
					model: Community,
					attributes: ["id", "name", "creator_id"],
				},
				{
					model: RiderAccount,
					as: "inviter",
					attributes: ["id", "name", "username", "profile_image_url"],
				},
			],
			order: [["created_at", "DESC"]],
		});

		return res.status(200).json({
			success: true,
			data: {
				invitations: invitations.map((inv) => ({
					id: inv.id,
					communityId: inv.community_id,
					rideId: inv.ride_id || null,
					communityName: inv.Community?.name || "Group Chat",
					inviterId: inv.inviter_id,
					inviterName: inv.inviter?.name || "Rider",
					inviterUsername: inv.inviter?.username || null,
					inviterAvatar: inv.inviter?.profile_image_url || null,
					status: inv.status,
					createdAt: inv.created_at,
				})),
			},
		});
	} catch (error) {
		console.error("Failed to list group chat invitations:", error);
		return formatError(
			res,
			500,
			"Failed to load group chat invitations",
			"CHAT_INVITATIONS_LIST_ERR",
		);
	}
};

exports.acceptGroupChatInvitation = async (req, res) => {
	try {
		const riderId = req.user.id;
		const invitationId = req.params.invitationId;

		const invitation = await GroupChatInvitation.findByPk(invitationId, {
			attributes: ["id", "community_id", "invited_rider_id", "status"],
		});

		if (!invitation) {
			return formatError(
				res,
				404,
				"Invitation not found",
				"CHAT_INVITATION_NOT_FOUND",
			);
		}

		if (invitation.invited_rider_id !== riderId) {
			return formatError(
				res,
				403,
				"You cannot accept this invitation",
				"CHAT_INVITATION_FORBIDDEN",
			);
		}

		if (invitation.status !== "PENDING") {
			return formatError(
				res,
				400,
				`Invitation is already ${invitation.status.toLowerCase()}`,
				"CHAT_INVITATION_ALREADY_PROCESSED",
			);
		}

		// Update invitation status
		invitation.status = "ACCEPTED";
		await invitation.save();

		// Add user to community members
		await CommunityMember.findOrCreate({
			where: {
				community_id: invitation.community_id,
				rider_id: riderId,
			},
			defaults: {
				role: "MEMBER",
			},
		});

		return res.status(200).json({
			success: true,
			data: {
				invitationId: invitation.id,
				communityId: invitation.community_id,
				rideId: invitation.ride_id || null,
				status: "ACCEPTED",
			},
		});
	} catch (error) {
		console.error("Failed to accept group chat invitation:", error);
		return formatError(
			res,
			500,
			"Failed to accept invitation",
			"CHAT_INVITATION_ACCEPT_ERR",
		);
	}
};

exports.declineGroupChatInvitation = async (req, res) => {
	try {
		const riderId = req.user.id;
		const invitationId = req.params.invitationId;

		const invitation = await GroupChatInvitation.findByPk(invitationId, {
			attributes: ["id", "community_id", "invited_rider_id", "status"],
		});

		if (!invitation) {
			return formatError(
				res,
				404,
				"Invitation not found",
				"CHAT_INVITATION_NOT_FOUND",
			);
		}

		if (invitation.invited_rider_id !== riderId) {
			return formatError(
				res,
				403,
				"You cannot decline this invitation",
				"CHAT_INVITATION_FORBIDDEN",
			);
		}

		if (invitation.status !== "PENDING") {
			return formatError(
				res,
				400,
				`Invitation is already ${invitation.status.toLowerCase()}`,
				"CHAT_INVITATION_ALREADY_PROCESSED",
			);
		}

		// Update invitation status
		invitation.status = "DECLINED";
		await invitation.save();

		return res.status(200).json({
			success: true,
			data: {
				invitationId: invitation.id,
				communityId: invitation.community_id,
				rideId: invitation.ride_id || null,
				status: "DECLINED",
			},
		});
	} catch (error) {
		console.error("Failed to decline group chat invitation:", error);
		return formatError(
			res,
			500,
			"Failed to decline invitation",
			"CHAT_INVITATION_DECLINE_ERR",
		);
	}
};

exports.inviteUserToGroupChat = async (req, res) => {
	try {
		const inviterId = req.user.id;
		const communityId = req.params.communityId;
		const { invitedRiderIds, rideId } = req.body;

		// Verify community exists and user is authorized (community creator or member)
		const community = await Community.findByPk(communityId, {
			attributes: ["id", "creator_id"],
		});

		if (!community) {
			return formatError(
				res,
				404,
				"Community not found",
				"COMMUNITY_NOT_FOUND",
			);
		}

		// Currently only community creator can invite (can be relaxed later to members)
		if (community.creator_id !== inviterId) {
			return formatError(
				res,
				403,
				"Only the community creator can invite members",
				"COMMUNITY_INVITE_FORBIDDEN",
			);
		}

		if (!Array.isArray(invitedRiderIds) || invitedRiderIds.length === 0) {
			return formatError(
				res,
				400,
				"invitedRiderIds must be a non-empty array",
				"CHAT_INVITATION_INVALID",
			);
		}

		if (rideId) {
			const ride = await Ride.findByPk(rideId, {
				attributes: ["id", "community_id"],
			});
			if (!ride || ride.community_id !== communityId) {
				return formatError(
					res,
					400,
					"rideId is invalid for this community",
					"CHAT_INVITATION_INVALID_RIDE",
				);
			}
		}

		// Verify all invited riders exist
		const riders = await RiderAccount.findAll({
			where: { id: { [Op.in]: invitedRiderIds } },
			attributes: ["id"],
		});

		if (riders.length !== invitedRiderIds.length) {
			return formatError(
				res,
				400,
				"One or more invited riders do not exist",
				"CHAT_INVITATION_INVALID_RIDERS",
			);
		}

		// Create invitations for each rider (skip if already exists)
		const invitations = [];
		for (const riderId of invitedRiderIds) {
			if (riderId === inviterId) {
				continue; // Don't invite self
			}

			const [invitation] = await GroupChatInvitation.findOrCreate({
				where: {
					community_id: communityId,
					ride_id: rideId || null,
					invited_rider_id: riderId,
				},
				defaults: {
					inviter_id: inviterId,
					ride_id: rideId || null,
					status: "PENDING",
				},
			});

			invitations.push(invitation);
		}

		// Notify invited riders
		const inviter = await RiderAccount.findByPk(inviterId, {
			attributes: ["name", "username"],
		});
		const inviterName = inviter?.username
			? `@${inviter.username}`
			: inviter?.name || "A rider";

		await createNotifications({
			recipientIds: invitedRiderIds.filter((id) => id !== inviterId),
			actorId: inviterId,
			type: "GROUP_CHAT_INVITED",
			title: `${inviterName} invited you to group chat`,
			body: community.name,
			entityType: "group_chat",
			entityId: communityId,
			metadata: {
				communityId,
				rideId: rideId || null,
				inviterId,
			},
		});

		return res.status(201).json({
			success: true,
			data: {
				communityId,
				invitedCount: invitations.length,
			},
		});
	} catch (error) {
		console.error("Failed to invite users to group chat:", error);
		return formatError(
			res,
			500,
			"Failed to send invitations",
			"CHAT_INVITATION_SEND_ERR",
		);
	}
};
