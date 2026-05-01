const { randomUUID } = require("crypto");
const { Op } = require("sequelize");
const {
	Community,
	CommunityMember,
	Friend,
	Ride,
	RideParticipant,
	RiderAccount,
	RideLocationPoint,
	UserEncryptedChat,
} = require("../models");
const { formatError } = require("../utils/errorFormatter");
const { canCreateContentOrRide } = require("../utils/profileAccess");
const {
	haversineDistanceMeters,
	calculateSpeedKmh,
} = require("../services/telemetryService");
const { createNotifications } = require("../services/notificationService");
const chatCryptoService = require("../services/chatCryptoService");
const websocketHub = require("../websockets/hub");

const MAX_REASONABLE_SPEED_KMH = 220;
const RIDE_INVITE_PREFIX = "[RIDE_INVITE]";
const RIDE_SYSTEM_PREFIX = "[RIDE_SYSTEM]";

const isFiniteNumber = (value) =>
	typeof value === "number" && Number.isFinite(value);

const clampSpeed = (value) => {
	if (!isFiniteNumber(value) || value < 0) {
		return null;
	}

	return Math.min(value, MAX_REASONABLE_SPEED_KMH);
};

const normalizeRouteMeta = (details) => {
	const base = details && typeof details === "object" ? details : {};

	const sourceCoordinates =
		base.sourceCoordinates &&
		isFiniteNumber(base.sourceCoordinates.latitude) &&
		isFiniteNumber(base.sourceCoordinates.longitude)
			? {
					latitude: base.sourceCoordinates.latitude,
					longitude: base.sourceCoordinates.longitude,
				}
			: null;

	const destinationCoordinates =
		base.destinationCoordinates &&
		isFiniteNumber(base.destinationCoordinates.latitude) &&
		isFiniteNumber(base.destinationCoordinates.longitude)
			? {
					latitude: base.destinationCoordinates.latitude,
					longitude: base.destinationCoordinates.longitude,
				}
			: null;

	const routePolyline = Array.isArray(base.routePolyline)
		? base.routePolyline.filter(
				(point) =>
					point &&
					isFiniteNumber(point.latitude) &&
					isFiniteNumber(point.longitude),
			)
		: [];

	return {
		source:
			typeof base.source === "string" && base.source.trim().length > 0
				? base.source
				: null,
		destination:
			typeof base.destination === "string" && base.destination.trim().length > 0
				? base.destination
				: null,
		sourceCoordinates,
		destinationCoordinates,
		routePolyline,
	};
};

const normalizeRideStatus = (status) => {
	const normalized = String(status || "").toUpperCase();

	if (normalized === "PLANNING") {
		return "PENDING";
	}

	return normalized || "PENDING";
};

const serializeRideSystemMessage = (message) =>
	`${RIDE_SYSTEM_PREFIX}${String(message || "").trim()}`;

const buildRideInviteMessage = ({ ride, details, inviteeId, inviter }) =>
	`${RIDE_INVITE_PREFIX}${JSON.stringify({
		type: "ride-invite",
		inviteId: randomUUID(),
		rideId: ride.id,
		roomName:
			typeof details.rideTitle === "string" &&
			details.rideTitle.trim().length > 0
				? details.rideTitle.trim()
				: `${details.source || "Ride"} -> ${details.destination || "Destination"}`,
		inviterId: inviter.id,
		inviterName: inviter.username
			? `@${inviter.username}`
			: inviter.name || "Rider",
		status: "pending",
		sentAt: new Date().toISOString(),
		rideTitle:
			typeof details.rideTitle === "string" &&
			details.rideTitle.trim().length > 0
				? details.rideTitle.trim()
				: undefined,
		source: details.source || undefined,
		destination: details.destination || undefined,
		startDate: details.startDate || undefined,
		endDate: details.endDate || undefined,
		days: Number.isFinite(Number(details.days))
			? Number(details.days)
			: undefined,
		budget: Number.isFinite(Number(details.budget))
			? Number(details.budget)
			: undefined,
		ridePace: details.ridePace || undefined,
		roadPreference: details.roadPreference || undefined,
		meetupNotes: details.meetupNotes || undefined,
		inviteeId,
	})}`;

const createStoredDirectMessage = async ({
	senderId,
	receiverId,
	plainText,
}) => {
	const roomId = `direct:${[senderId, receiverId].sort().join(":")}`;
	const encrypted = chatCryptoService.encryptMessage({
		plainText,
		roomId,
		senderId,
		receiverId,
	});

	return UserEncryptedChat.create({
		sender_id: senderId,
		receiver_id: receiverId,
		room_id: null,
		encrypted_payload: encrypted.encryptedPayload,
		iv: encrypted.iv,
	});
};

const createStoredRideRoomMessage = async ({ rideId, senderId, plainText }) => {
	const encrypted = chatCryptoService.encryptMessage({
		plainText,
		roomId: rideId,
		senderId,
		receiverId: null,
	});

	return UserEncryptedChat.create({
		sender_id: senderId,
		receiver_id: null,
		room_id: rideId,
		encrypted_payload: encrypted.encryptedPayload,
		iv: encrypted.iv,
	});
};

const toRidePayload = (ride, participants = [], options = {}) => {
	const organizerId = options.organizerId || ride.creator_id || null;
	const details = ride.route_polygon || {};
	return {
		id: ride.id,
		communityId: ride.community_id,
		status: normalizeRideStatus(ride.status),
		details,
		route: normalizeRouteMeta(details),
		participants,
		organizerId,
		isOrganizer:
			typeof options.currentUserId === "string" &&
			typeof organizerId === "string"
				? options.currentUserId === organizerId
				: false,
		createdAt: ride.created_at,
		updatedAt: ride.updated_at,
	};
};

const getOrganizerIdByCommunity = async (communityId) => {
	if (!communityId) {
		return null;
	}

	const community = await Community.findByPk(communityId, {
		attributes: ["id", "creator_id"],
	});

	return community?.creator_id || null;
};

const getOrCreateCommunityId = async (user, communityId) => {
	if (communityId) {
		const existing = await Community.findByPk(communityId);
		if (existing) {
			return existing.id;
		}
	}

	const existingByUser = await Community.findOne({
		where: { creator_id: user.id },
		order: [["created_at", "DESC"]],
	});

	if (existingByUser) {
		return existingByUser.id;
	}

	const created = await Community.create({
		creator_id: user.id,
		name: `${user.name || "Rider"}'s Group`,
	});

	return created.id;
};

const getLatestRideLocations = async (rideId) => {
	const latestPoints = await RideLocationPoint.findAll({
		where: { ride_id: rideId, is_latest: true },
		attributes: [
			"rider_id",
			"latitude",
			"longitude",
			"device_speed_kmh",
			"normalized_speed_kmh",
			"heading",
			"accuracy",
			"altitude",
			"source_timestamp",
			"created_at",
		],
	});

	if (latestPoints.length === 0) {
		return [];
	}

	const riderIds = latestPoints.map((entry) => entry.rider_id);
	const riders = await RiderAccount.findAll({
		where: { id: { [Op.in]: riderIds } },
		attributes: ["id", "name", "username", "profile_image_url"],
	});

	const riderById = new Map(riders.map((rider) => [rider.id, rider]));

	return latestPoints.map((point) => {
		const rider = riderById.get(point.rider_id);
		const updatedAt = point.source_timestamp || point.created_at;
		return {
			rideId,
			riderId: point.rider_id,
			name: rider?.name || "Rider",
			username: rider?.username || null,
			avatar: rider?.profile_image_url || null,
			latitude: point.latitude,
			longitude: point.longitude,
			deviceSpeedKmh: point.device_speed_kmh,
			speed: point.normalized_speed_kmh,
			heading: point.heading,
			accuracy: point.accuracy,
			altitude: point.altitude,
			timestamp: updatedAt,
			updatedAt,
		};
	});
};

const buildRideSnapshot = async (ride) => {
	const participants = await RideParticipant.findAll({
		where: {
			ride_id: ride.id,
			status: { [Op.notIn]: ["DECLINED"] },
		},
		attributes: ["rider_id", "status"],
	});

	const riderIds = participants.map((entry) => entry.rider_id);
	const riderProfiles = riderIds.length
		? await RiderAccount.findAll({
				where: { id: { [Op.in]: riderIds } },
				attributes: ["id", "name", "username", "profile_image_url", "bio"],
			})
		: [];

	const profileById = new Map(
		riderProfiles.map((profile) => [profile.id, profile]),
	);
	const leaderId = await getOrganizerIdByCommunity(ride.community_id);
	const locations = await getLatestRideLocations(ride.id);

	return {
		rideId: ride.id,
		rideStatus: normalizeRideStatus(ride.status),
		leaderRiderId: leaderId,
		route: normalizeRouteMeta(ride.route_polygon || {}),
		participants: participants.map((entry) => ({
			riderId: entry.rider_id,
			name: profileById.get(entry.rider_id)?.name || "Rider",
			username: profileById.get(entry.rider_id)?.username || null,
			avatar: profileById.get(entry.rider_id)?.profile_image_url || null,
			participantStatus: entry.status,
			isLeader: leaderId === entry.rider_id,
		})),
		locations,
		snapshotAt: new Date().toISOString(),
	};
};

const getRideParticipantDirectory = async (rideId, options = {}) => {
	const where = { ride_id: rideId };
	if (options.includeDeclined !== true) {
		where.status = { [Op.notIn]: ["DECLINED"] };
	}

	const participants = await RideParticipant.findAll({
		where,
		attributes: ["rider_id", "status"],
	});

	const riderIds = participants.map((entry) => entry.rider_id);
	const riders = riderIds.length
		? await RiderAccount.findAll({
				where: { id: { [Op.in]: riderIds } },
				attributes: ["id", "name", "username", "profile_image_url"],
			})
		: [];

	return {
		participants,
		ridersById: new Map(riders.map((rider) => [rider.id, rider])),
		participantIds: participants
			.map((entry) => entry.rider_id)
			.filter((value) => typeof value === "string" && value.length > 0),
	};
};

const emitRideChatMessage = ({
	participantIds,
	saved,
	rideId,
	sender,
	message,
}) => {
	for (const riderId of participantIds) {
		websocketHub.sendToRider(riderId, "CHAT_MESSAGE", {
			id: saved.id,
			roomId: rideId,
			senderId: sender.id,
			receiverId: null,
			message,
			createdAt: saved.created_at,
			senderName: sender.name || "Rider",
			senderUsername: sender.username || null,
		});
	}
};

const emitRideSyncRequired = ({ participantIds, rideId, reason }) => {
	for (const riderId of participantIds) {
		websocketHub.sendToRider(riderId, "RIDE_SYNC_REQUIRED", {
			rideId,
			reason,
			issuedAt: new Date().toISOString(),
		});
	}
};

const appendRideSystemMessage = async ({
	rideId,
	sender,
	participantIds,
	text,
}) => {
	if (!Array.isArray(participantIds) || participantIds.length === 0) {
		return null;
	}

	const saved = await createStoredRideRoomMessage({
		rideId,
		senderId: sender.id,
		plainText: serializeRideSystemMessage(text),
	});

	emitRideChatMessage({
		participantIds,
		saved,
		rideId,
		sender,
		message: serializeRideSystemMessage(text),
	});

	return saved;
};

const deliverRideInvites = async ({ ride, inviter, invitedRiderIds }) => {
	if (!Array.isArray(invitedRiderIds) || invitedRiderIds.length === 0) {
		return;
	}

	const details = ride.route_polygon || {};
	for (const riderId of invitedRiderIds) {
		const message = buildRideInviteMessage({
			ride,
			details,
			inviteeId: riderId,
			inviter,
		});
		const saved = await createStoredDirectMessage({
			senderId: inviter.id,
			receiverId: riderId,
			plainText: message,
		});

		websocketHub.sendToRider(riderId, "CHAT_MESSAGE", {
			id: saved.id,
			roomId: `direct:${[inviter.id, riderId].sort().join(":")}`,
			senderId: inviter.id,
			receiverId: riderId,
			message,
			createdAt: saved.created_at,
			senderName: inviter.name || "Rider",
			senderUsername: inviter.username || null,
		});
	}
};

exports.listFriends = async (req, res) => {
	const links = await Friend.findAll({
		where: {
			status: "ACCEPTED",
			[Op.or]: [{ user_id_1: req.user.id }, { user_id_2: req.user.id }],
		},
	});

	const friendIds = links.map((item) =>
		item.user_id_1 === req.user.id ? item.user_id_2 : item.user_id_1,
	);

	if (friendIds.length === 0) {
		return res.status(200).json({ success: true, data: { friends: [] } });
	}

	const friends = await RiderAccount.findAll({
		where: { id: { [Op.in]: friendIds } },
		attributes: ["id", "name", "username", "profile_image_url"],
	});

	return res.status(200).json({
		success: true,
		data: {
			friends: friends.map((friend) => ({
				id: friend.id,
				name: friend.name,
				username: friend.username,
				avatar: friend.profile_image_url,
			})),
		},
	});
};

exports.createRide = async (req, res) => {
	try {
		if (!canCreateContentOrRide(req.user)) {
			return formatError(
				res,
				403,
				"Please complete your profile before creating a ride",
				"PROFILE_SETUP_REQUIRED",
			);
		}

		const {
			rideType,
			communityId,
			privacy,
			rideTitle,
			source,
			destination,
			pickupLocation,
			dropLocation,
			startDate,
			endDate,
			days,
			budget,
			maxRiders,
			ridePace,
			roadPreference,
			meetupNotes,
			emergencyContactName,
			emergencyContactPhone,
			rideNotes,
			includesFood,
			includesFuel,
			bikeProvided,
			stayArranged,
			stayDetails,
			invitedFriendIds,
		} = req.body;

		if (rideType !== "solo" && rideType !== "group") {
			return formatError(
				res,
				400,
				"rideType must be solo or group",
				"RIDE_TYPE_INVALID",
			);
		}

		if (!source || !destination) {
			return formatError(
				res,
				400,
				"source and destination are required",
				"RIDE_LOC_REQUIRED",
			);
		}

		if (!startDate) {
			return formatError(
				res,
				400,
				"startDate is required",
				"RIDE_START_REQUIRED",
			);
		}

		if (rideType === "group" && !endDate) {
			return formatError(
				res,
				400,
				"endDate is required for group rides",
				"RIDE_END_REQUIRED",
			);
		}

		const resolvedCommunityId = await getOrCreateCommunityId(
			req.user,
			communityId,
		);

		const details = {
			rideType,
			privacy: privacy || (rideType === "solo" ? "solo" : "mixed"),
			rideTitle: rideTitle || "",
			source,
			destination,
			pickupLocation: pickupLocation || source,
			dropLocation: dropLocation || destination,
			startDate,
			endDate: endDate || null,
			days: Number(days || 1),
			budget: Number(budget || 0),
			maxRiders: Number(maxRiders || 0),
			ridePace: ridePace || "balanced",
			roadPreference: roadPreference || "mixed",
			meetupNotes: meetupNotes || "",
			emergencyContactName: emergencyContactName || "",
			emergencyContactPhone: emergencyContactPhone || "",
			rideNotes: rideNotes || "",
			includesFood: Boolean(includesFood),
			includesFuel: Boolean(includesFuel),
			bikeProvided: Boolean(bikeProvided),
			stayArranged: Boolean(stayArranged),
			stayDetails: stayArranged ? stayDetails || "" : "",
		};

		const ride = await Ride.create({
			community_id: resolvedCommunityId,
			creator_id: req.user.id,
			status: "PENDING",
			route_polygon: details,
		});

		await RideParticipant.create({
			ride_id: ride.id,
			rider_id: req.user.id,
			status: "CONFIRMED",
		});

		const inviteIds =
			rideType === "group" && Array.isArray(invitedFriendIds)
				? invitedFriendIds
				: [];

		if (inviteIds.length > 0) {
			await RideParticipant.bulkCreate(
				inviteIds.map((friendId) => ({
					ride_id: ride.id,
					rider_id: friendId,
					status: "INVITED",
				})),
				{ ignoreDuplicates: true },
			);
		}

		const inviter = await RiderAccount.findByPk(req.user.id, {
			attributes: ["id", "name", "username"],
		});

		if (inviter && inviteIds.length > 0) {
			await createNotifications({
				recipientIds: inviteIds.filter((id) => id !== req.user.id),
				actorId: req.user.id,
				type: "RIDE_INVITED",
				title: inviter.username
					? `@${inviter.username} invited you to a ride`
					: `${inviter.name || "A rider"} invited you to a ride`,
				body: "Open the ride chat to accept or decline.",
				entityType: "ride",
				entityId: ride.id,
				metadata: {
					rideId: ride.id,
					communityId: ride.community_id,
				},
			});

			const inviteeDirectory = await RiderAccount.findAll({
				where: { id: { [Op.in]: inviteIds } },
				attributes: ["id", "name"],
			});

			const invitedNames = inviteeDirectory
				.map((entry) => entry.name || "Rider")
				.slice(0, 3);
			const inviteText =
				inviteeDirectory.length > 0
					? inviteeDirectory.length > 3
						? `Invited ${invitedNames.join(", ")} and ${inviteeDirectory.length - 3} more riders.`
						: `Invited ${invitedNames.join(", ")} to this ride.`
					: "Sent ride invites.";

			const { participantIds } = await getRideParticipantDirectory(ride.id);
			await appendRideSystemMessage({
				rideId: ride.id,
				sender: inviter,
				participantIds,
				text: inviteText,
			});
			await deliverRideInvites({
				ride,
				inviter,
				invitedRiderIds: inviteIds.filter((id) => id !== req.user.id),
			});
		}

		const participants = await RideParticipant.findAll({
			where: { ride_id: ride.id },
			attributes: ["rider_id", "status"],
		});

		return res.status(201).json({
			success: true,
			data: {
				ride: toRidePayload(
					ride,
					participants.map((entry) => ({
						riderId: entry.rider_id,
						status: entry.status,
					})),
				),
			},
		});
	} catch (error) {
		console.error("createRide error", error);
		return formatError(res, 500, "Failed to create ride", "RIDE_CREATE_ERR");
	}
};

exports.getRideById = async (req, res) => {
	const ride = await Ride.findByPk(req.params.rideId);

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	const participants = await RideParticipant.findAll({
		where: { ride_id: ride.id },
		attributes: ["rider_id", "status"],
	});
	const community = await Community.findByPk(ride.community_id, {
		attributes: ["id", "name", "creator_id"],
	});
	const organizerId = community?.creator_id || null;

	const participantIds = participants.map((entry) => entry.rider_id);
	const profiles = participantIds.length
		? await RiderAccount.findAll({
				where: { id: { [Op.in]: participantIds } },
				attributes: ["id", "name", "username", "profile_image_url", "bio"],
			})
		: [];

	const profileById = profiles.reduce((acc, profile) => {
		acc[profile.id] = profile;
		return acc;
	}, {});

	const riderProfiles = participants.map((entry) => {
		const profile = profileById[entry.rider_id];
		return {
			id: entry.rider_id,
			name: profile?.name || "Rider",
			username: profile?.username || null,
			avatar: profile?.profile_image_url || null,
			bio: profile?.bio || null,
			status: entry.status,
			isOrganizer: organizerId === entry.rider_id,
		};
	});

	const organizerProfile =
		organizerId && profileById[organizerId]
			? {
					id: organizerId,
					name: profileById[organizerId].name || "Organizer",
					username: profileById[organizerId].username || null,
					avatar: profileById[organizerId].profile_image_url || null,
					bio: profileById[organizerId].bio || null,
				}
			: organizerId
				? await RiderAccount.findByPk(organizerId, {
						attributes: ["id", "name", "username", "profile_image_url", "bio"],
					}).then((profile) =>
						profile
							? {
									id: profile.id,
									name: profile.name || "Organizer",
									username: profile.username || null,
									avatar: profile.profile_image_url || null,
									bio: profile.bio || null,
								}
							: null,
					)
				: null;

	return res.status(200).json({
		success: true,
		data: {
			ride: {
				...toRidePayload(
					ride,
					participants.map((entry) => ({
						riderId: entry.rider_id,
						status: entry.status,
					})),
					{ organizerId, currentUserId: req.user.id },
				),
				communityName: community?.name || null,
				organizerProfile,
				riderProfiles,
			},
		},
	});
};

exports.getCommunityRides = async (req, res) => {
	const selectedLocation =
		typeof req.query.location === "string" &&
		req.query.location.trim().length > 0
			? req.query.location.trim().toLowerCase()
			: "";

	const rides = await Ride.findAll({
		order: [["created_at", "DESC"]],
		limit: 50,
	});

	const rideIds = rides.map((ride) => ride.id);
	const participants = rideIds.length
		? await RideParticipant.findAll({
				where: { ride_id: { [Op.in]: rideIds } },
				attributes: ["ride_id", "rider_id", "status"],
			})
		: [];

	const byRide = participants.reduce((acc, item) => {
		if (!acc[item.ride_id]) {
			acc[item.ride_id] = [];
		}
		acc[item.ride_id].push(item);
		return acc;
	}, {});

	const groupRides = rides
		.filter((ride) => (ride.route_polygon || {}).rideType === "group")
		.filter((ride) => {
			const details = ride.route_polygon || {};
			const privacy = String(details.privacy || "").toLowerCase();
			const haystack = [
				details.source,
				details.destination,
				details.pickupLocation,
				details.dropLocation,
			]
				.filter((value) => typeof value === "string" && value.trim().length > 0)
				.join(" ")
				.toLowerCase();

			const matchesLocation =
				selectedLocation.length === 0 || haystack.includes(selectedLocation);
			const isCommunityRide = privacy !== "friends";

			return matchesLocation && isCommunityRide;
		})
		.map((ride) => ({
			communityId: ride.community_id,
			id: ride.id,
			status: normalizeRideStatus(ride.status),
			details: ride.route_polygon || {},
			joinedCount: (byRide[ride.id] || []).filter(
				(item) => item.status === "CONFIRMED" || item.status === "STARTED",
			).length,
			invitedCount: (byRide[ride.id] || []).filter(
				(item) => item.status === "INVITED",
			).length,
		}));

	const communityIds = Array.from(
		new Set(groupRides.map((ride) => ride.communityId).filter(Boolean)),
	);
	const communities = communityIds.length
		? await Community.findAll({
				where: { id: { [Op.in]: communityIds } },
				attributes: ["id", "creator_id"],
			})
		: [];
	const organizerByCommunity = communities.reduce((acc, community) => {
		acc[community.id] = community.creator_id;
		return acc;
	}, {});

	const enrichedGroupRides = groupRides.map((ride) => {
		const organizerId = organizerByCommunity[ride.communityId] || null;
		return {
			...ride,
			organizerId,
			isOrganizer: organizerId === req.user.id,
		};
	});

	const myRides = enrichedGroupRides.filter((ride) =>
		(byRide[ride.id] || []).some((item) => item.rider_id === req.user.id),
	);

	const activeRide = myRides.find((item) => item.status === "ACTIVE") || null;

	return res.status(200).json({
		success: true,
		data: {
			activeRide,
			nearbyRides: enrichedGroupRides.filter(
				(ride) => ride.status !== "COMPLETED",
			),
			myRides,
		},
	});
};

exports.joinRide = async (req, res) => {
	const ride = await Ride.findByPk(req.params.rideId);

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	if (normalizeRideStatus(ride.status) === "COMPLETED") {
		return formatError(
			res,
			400,
			"Ride has already ended",
			"RIDE_ALREADY_COMPLETED",
		);
	}

	const [participant, created] = await RideParticipant.findOrCreate({
		where: { ride_id: ride.id, rider_id: req.user.id },
		defaults: { status: "CONFIRMED" },
	});
	let membershipChanged = created;

	if (
		!created &&
		["INVITED", "PENDING", "DECLINED"].includes(participant.status)
	) {
		participant.status = "CONFIRMED";
		await participant.save();
		membershipChanged = true;
	}

	if (membershipChanged) {
		if (ride.community_id) {
			await CommunityMember.findOrCreate({
				where: {
					community_id: ride.community_id,
					rider_id: req.user.id,
				},
				defaults: { role: "MEMBER" },
			});
		}

		const rider = await RiderAccount.findByPk(req.user.id, {
			attributes: ["id", "name", "username"],
		});
		const { participantIds } = await getRideParticipantDirectory(ride.id);
		if (rider) {
			await appendRideSystemMessage({
				rideId: ride.id,
				sender: rider,
				participantIds,
				text: `${rider.name || "A rider"} joined the ride.`,
			});
		}
		emitRideSyncRequired({
			participantIds,
			rideId: ride.id,
			reason: "ride-joined",
		});
	}

	return res.status(200).json({
		success: true,
		data: { rideId: ride.id, joined: true },
	});
};

exports.acceptInvitation = async (req, res) => {
	const participant = await RideParticipant.findOne({
		where: {
			ride_id: req.params.rideId,
			rider_id: req.user.id,
			status: "INVITED",
		},
	});

	if (!participant) {
		return formatError(
			res,
			404,
			"Invitation not found",
			"RIDE_INVITE_NOT_FOUND",
		);
	}

	participant.status = "CONFIRMED";
	await participant.save();

	const ride = await Ride.findByPk(req.params.rideId, {
		attributes: ["id"],
	});
	const rider = await RiderAccount.findByPk(req.user.id, {
		attributes: ["id", "name", "username"],
	});
	const { participantIds } = await getRideParticipantDirectory(
		req.params.rideId,
	);
	if (ride && rider) {
		await appendRideSystemMessage({
			rideId: ride.id,
			sender: rider,
			participantIds,
			text: `${rider.name || "A rider"} accepted the ride invite.`,
		});
	}
	emitRideSyncRequired({
		participantIds,
		rideId: req.params.rideId,
		reason: "invite-accepted",
	});

	return res.status(200).json({ success: true, data: { accepted: true } });
};

exports.declineInvitation = async (req, res) => {
	const participant = await RideParticipant.findOne({
		where: {
			ride_id: req.params.rideId,
			rider_id: req.user.id,
			status: "INVITED",
		},
	});

	if (!participant) {
		return formatError(
			res,
			404,
			"Invitation not found",
			"RIDE_INVITE_NOT_FOUND",
		);
	}

	participant.status = "DECLINED";
	await participant.save();

	const ride = await Ride.findByPk(req.params.rideId, {
		attributes: ["id"],
	});
	const rider = await RiderAccount.findByPk(req.user.id, {
		attributes: ["id", "name", "username"],
	});
	const { participantIds } = await getRideParticipantDirectory(
		req.params.rideId,
		{
			includeDeclined: true,
		},
	);
	const remainingParticipantIds = participantIds.filter(
		(id) => id !== req.user.id,
	);
	if (ride && rider) {
		await appendRideSystemMessage({
			rideId: ride.id,
			sender: rider,
			participantIds: remainingParticipantIds,
			text: `${rider.name || "A rider"} declined the ride invite.`,
		});
	}
	emitRideSyncRequired({
		participantIds: remainingParticipantIds,
		rideId: req.params.rideId,
		reason: "invite-declined",
	});

	return res.status(200).json({ success: true, data: { accepted: false } });
};

exports.leaveRide = async (req, res) => {
	const ride = await Ride.findByPk(req.params.rideId, {
		attributes: ["id", "community_id"],
	});

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	if (normalizeRideStatus(ride.status) === "COMPLETED") {
		return formatError(
			res,
			400,
			"Ride has already ended",
			"RIDE_ALREADY_COMPLETED",
		);
	}

	const organizerId = await getOrganizerIdByCommunity(ride.community_id);
	if (organizerId && organizerId === req.user.id) {
		return formatError(
			res,
			403,
			"Ride organizer must end the ride instead of leaving it",
			"RIDE_ORGANIZER_CANNOT_LEAVE",
		);
	}

	const rider = await RiderAccount.findByPk(req.user.id, {
		attributes: ["id", "name", "username"],
	});
	const { participantIds } = await getRideParticipantDirectory(
		req.params.rideId,
	);

	const removedCount = await RideParticipant.destroy({
		where: { ride_id: req.params.rideId, rider_id: req.user.id },
	});

	if (removedCount === 0) {
		return formatError(
			res,
			404,
			"You are not part of this ride",
			"RIDE_PARTICIPANT_NOT_FOUND",
		);
	}

	const remainingParticipantIds = participantIds.filter(
		(id) => id !== req.user.id,
	);
	if (rider) {
		await appendRideSystemMessage({
			rideId: req.params.rideId,
			sender: rider,
			participantIds: remainingParticipantIds,
			text: `${rider.name || "A rider"} left the ride.`,
		});
	}
	emitRideSyncRequired({
		participantIds: remainingParticipantIds,
		rideId: req.params.rideId,
		reason: "ride-left",
	});

	return res.status(200).json({
		success: true,
		data: { rideId: req.params.rideId, joined: false },
	});
};

exports.startRide = async (req, res) => {
	const ride = await Ride.findByPk(req.params.rideId, {
		attributes: ["id", "creator_id", "community_id", "status"],
	});

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	const organizerId = await getOrganizerIdByCommunity(ride.community_id);

	// Check authorization: only the organizer can start the ride
	if ((organizerId || ride.creator_id) !== req.user.id) {
		return formatError(
			res,
			403,
			"Only the ride organizer can start this ride",
			"RIDE_START_FORBIDDEN",
		);
	}

	if (normalizeRideStatus(ride.status) === "COMPLETED") {
		return formatError(
			res,
			400,
			"Ride has already ended",
			"RIDE_ALREADY_COMPLETED",
		);
	}

	ride.status = "ACTIVE";
	await ride.save();

	await RideParticipant.update(
		{ status: "STARTED" },
		{
			where: {
				ride_id: ride.id,
				status: { [Op.in]: ["CONFIRMED", "STARTED"] },
			},
		},
	);

	const starter = await RiderAccount.findByPk(req.user.id, {
		attributes: ["id", "name", "username"],
	});
	const { participantIds } = await getRideParticipantDirectory(ride.id);
	if (starter) {
		await appendRideSystemMessage({
			rideId: ride.id,
			sender: starter,
			participantIds,
			text: `${starter.name || "Organizer"} started the ride.`,
		});
	}

	for (const riderId of participantIds) {
		websocketHub.sendToRider(riderId, "RIDE_STARTED", {
			rideId: ride.id,
			startedBy: req.user.id,
			rideStatus: "ACTIVE",
			startedAt: new Date().toISOString(),
		});
	}
	emitRideSyncRequired({
		participantIds,
		rideId: ride.id,
		reason: "ride-started",
	});

	return res.status(200).json({
		success: true,
		data: { rideId: req.params.rideId, status: "ACTIVE" },
	});
};

exports.endRide = async (req, res) => {
	const ride = await Ride.findByPk(req.params.rideId);

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	const organizerId = await getOrganizerIdByCommunity(ride.community_id);
	if (!organizerId || organizerId !== req.user.id) {
		return formatError(
			res,
			403,
			"Only the ride organizer can end this ride",
			"RIDE_END_FORBIDDEN",
		);
	}

	ride.status = "COMPLETED";
	await ride.save();

	await RideParticipant.update(
		{ status: "COMPLETED" },
		{
			where: {
				ride_id: ride.id,
				status: { [Op.in]: ["STARTED", "CONFIRMED"] },
			},
		},
	);

	const participants = await RideParticipant.findAll({
		where: { ride_id: ride.id },
		attributes: ["rider_id"],
	});

	const participantIds = participants
		.map((entry) => entry.rider_id)
		.filter((value) => typeof value === "string" && value.length > 0);
	const organizer = await RiderAccount.findByPk(req.user.id, {
		attributes: ["id", "name", "username"],
	});

	if (organizer) {
		await appendRideSystemMessage({
			rideId: ride.id,
			sender: organizer,
			participantIds,
			text: `${organizer.name || "Organizer"} ended the ride.`,
		});
	}

	for (const riderId of participantIds) {
		websocketHub.sendToRider(riderId, "RIDE_ENDED", {
			rideId: ride.id,
			endedBy: req.user.id,
			rideStatus: "COMPLETED",
			endedAt: new Date().toISOString(),
		});
	}
	emitRideSyncRequired({
		participantIds,
		rideId: ride.id,
		reason: "ride-ended",
	});

	return res.status(200).json({
		success: true,
		data: { rideId: req.params.rideId, status: "COMPLETED" },
	});
};

exports.updateParticipantStatus = async (req, res) => {
	const participant = await RideParticipant.findOne({
		where: {
			ride_id: req.params.rideId,
			rider_id: req.user.id,
		},
	});

	if (!participant) {
		return formatError(
			res,
			404,
			"Participant not found",
			"RIDE_PARTICIPANT_NOT_FOUND",
		);
	}

	if (typeof req.body.status === "string" && req.body.status.length > 0) {
		participant.status = req.body.status;
	}

	await participant.save();

	return res.status(200).json({
		success: true,
		data: {
			rideId: req.params.rideId,
			status: participant.status,
			distance: req.body.distance,
		},
	});
};

exports.updateLocation = async (req, res) => {
	const { latitude, longitude, speed, heading, accuracy, altitude, timestamp } =
		req.body;

	if (typeof latitude !== "number" || typeof longitude !== "number") {
		return formatError(
			res,
			400,
			"latitude and longitude are required",
			"RIDE_LOC_INVALID",
		);
	}

	const ride = await Ride.findByPk(req.params.rideId, {
		attributes: ["id", "status"],
	});

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	if (normalizeRideStatus(ride.status) !== "ACTIVE") {
		return formatError(res, 400, "Ride is not active yet", "RIDE_NOT_ACTIVE");
	}

	const participant = await RideParticipant.findOne({
		where: {
			ride_id: ride.id,
			rider_id: req.user.id,
			status: { [Op.notIn]: ["DECLINED"] },
		},
		attributes: ["status"],
	});

	if (!participant) {
		return formatError(
			res,
			403,
			"You are not part of this ride",
			"RIDE_ACCESS_DENIED",
		);
	}

	const sourceTimestamp = (() => {
		const parsed = new Date(
			typeof timestamp === "string" ? timestamp : Date.now(),
		);
		if (Number.isNaN(parsed.getTime())) {
			return new Date();
		}
		return parsed;
	})();

	const previousPoint = await RideLocationPoint.findOne({
		where: {
			ride_id: ride.id,
			rider_id: req.user.id,
			is_latest: true,
		},
		attributes: ["latitude", "longitude", "source_timestamp"],
		order: [["created_at", "DESC"]],
	});

	const deviceSpeedKmh = clampSpeed(speed);
	let computedSpeedKmh = null;

	if (previousPoint) {
		const distanceMeters = haversineDistanceMeters(
			{
				latitude: previousPoint.latitude,
				longitude: previousPoint.longitude,
				timestamp: previousPoint.source_timestamp,
			},
			{
				latitude,
				longitude,
				timestamp: sourceTimestamp.toISOString(),
			},
		);

		const durationSeconds =
			(sourceTimestamp.getTime() -
				new Date(previousPoint.source_timestamp).getTime()) /
			1000;

		computedSpeedKmh = clampSpeed(
			calculateSpeedKmh({ distanceMeters, durationSeconds }),
		);
	}

	const normalizedSpeed =
		deviceSpeedKmh != null ? deviceSpeedKmh : computedSpeedKmh;

	await RideLocationPoint.update(
		{ is_latest: false },
		{
			where: {
				ride_id: ride.id,
				rider_id: req.user.id,
				is_latest: true,
			},
		},
	);

	await RideLocationPoint.create({
		ride_id: ride.id,
		rider_id: req.user.id,
		latitude,
		longitude,
		device_speed_kmh: deviceSpeedKmh,
		normalized_speed_kmh: normalizedSpeed,
		heading: isFiniteNumber(heading) ? heading : null,
		accuracy: isFiniteNumber(accuracy) ? accuracy : null,
		altitude: isFiniteNumber(altitude) ? altitude : null,
		source_timestamp: sourceTimestamp,
		is_latest: true,
	});

	return res.status(200).json({
		success: true,
		data: {
			updated: true,
			rideId: ride.id,
			riderId: req.user.id,
			speed: normalizedSpeed,
			deviceSpeedKmh,
			timestamp: sourceTimestamp.toISOString(),
		},
	});
};

exports.getRideLocations = async (req, res) => {
	const ride = await Ride.findByPk(req.params.rideId, {
		attributes: ["id"],
	});

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	const participant = await RideParticipant.findOne({
		where: {
			ride_id: ride.id,
			rider_id: req.user.id,
			status: { [Op.notIn]: ["DECLINED"] },
		},
		attributes: ["rider_id"],
	});

	if (!participant) {
		return formatError(
			res,
			403,
			"You are not part of this ride",
			"RIDE_ACCESS_DENIED",
		);
	}

	const locations = await getLatestRideLocations(ride.id);

	return res.status(200).json({
		success: true,
		data: {
			locations,
			refreshIntervalMinutes: 0,
		},
	});
};

exports.getRideReports = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { rideId: req.params.rideId, reports: [] } });
};

exports.getRideSnapshot = async (req, res) => {
	const ride = await Ride.findByPk(req.params.rideId);

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	const participant = await RideParticipant.findOne({
		where: {
			ride_id: ride.id,
			rider_id: req.user.id,
			status: { [Op.notIn]: ["DECLINED"] },
		},
		attributes: ["rider_id"],
	});

	if (!participant) {
		return formatError(
			res,
			403,
			"You are not part of this ride",
			"RIDE_ACCESS_DENIED",
		);
	}

	const snapshot = await buildRideSnapshot(ride);

	return res.status(200).json({
		success: true,
		data: {
			snapshot,
		},
	});
};

exports.inviteRiders = async (req, res) => {
	try {
		const ride = await Ride.findByPk(req.params.rideId, {
			attributes: ["id", "community_id", "creator_id", "status"],
		});

		if (!ride) {
			return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
		}

		const organizerId = await getOrganizerIdByCommunity(ride.community_id);
		if (!organizerId || organizerId !== req.user.id) {
			return formatError(
				res,
				403,
				"Only the ride organizer can invite riders",
				"RIDE_INVITE_FORBIDDEN",
			);
		}

		if (normalizeRideStatus(ride.status) === "COMPLETED") {
			return formatError(
				res,
				400,
				"Cannot invite riders to an ended ride",
				"RIDE_ALREADY_COMPLETED",
			);
		}

		const invitedRiderIds = Array.isArray(req.body.invitedRiderIds)
			? Array.from(
					new Set(
						req.body.invitedRiderIds.filter(
							(value) => typeof value === "string" && value.length > 0,
						),
					),
				)
			: [];

		if (invitedRiderIds.length === 0) {
			return formatError(
				res,
				400,
				"invitedRiderIds must be a non-empty array",
				"RIDE_INVITE_BAD_PAYLOAD",
			);
		}

		const existingParticipants = await RideParticipant.findAll({
			where: {
				ride_id: ride.id,
				rider_id: { [Op.in]: invitedRiderIds },
			},
			attributes: ["rider_id", "status"],
		});

		const existingById = new Map(
			existingParticipants.map((entry) => [entry.rider_id, entry]),
		);

		const createdInvites = [];
		for (const riderId of invitedRiderIds) {
			if (riderId === req.user.id) {
				continue;
			}

			const existing = existingById.get(riderId);
			if (existing) {
				if (existing.status === "DECLINED") {
					existing.status = "INVITED";
					await existing.save();
					createdInvites.push(riderId);
				}
				continue;
			}

			await RideParticipant.create({
				ride_id: ride.id,
				rider_id: riderId,
				status: "INVITED",
			});
			createdInvites.push(riderId);
		}

		if (createdInvites.length > 0) {
			const organizer = await RiderAccount.findByPk(req.user.id, {
				attributes: ["id", "name", "username"],
			});

			const organizerName = organizer?.username
				? `@${organizer.username}`
				: organizer?.name || "A rider";

			await createNotifications({
				recipientIds: createdInvites,
				actorId: req.user.id,
				type: "RIDE_INVITED",
				title: `${organizerName} invited you to a ride`,
				body: "Open the ride room to accept or decline.",
				entityType: "ride",
				entityId: ride.id,
				metadata: {
					rideId: ride.id,
					communityId: ride.community_id,
				},
			});

			const invitedRiders = await RiderAccount.findAll({
				where: { id: { [Op.in]: createdInvites } },
				attributes: ["id", "name"],
			});
			const invitedNames = invitedRiders
				.map((entry) => entry.name || "Rider")
				.slice(0, 3);
			const inviteText =
				invitedRiders.length > 3
					? `Invited ${invitedNames.join(", ")} and ${invitedRiders.length - 3} more riders.`
					: `Invited ${invitedNames.join(", ")} to this ride.`;

			const { participantIds } = await getRideParticipantDirectory(ride.id);
			if (organizer) {
				await appendRideSystemMessage({
					rideId: ride.id,
					sender: organizer,
					participantIds,
					text: inviteText,
				});
				await deliverRideInvites({
					ride,
					inviter: organizer,
					invitedRiderIds: createdInvites,
				});
			}
			emitRideSyncRequired({
				participantIds,
				rideId: ride.id,
				reason: "ride-invited",
			});
		}

		return res.status(201).json({
			success: true,
			data: {
				rideId: ride.id,
				invitedCount: createdInvites.length,
			},
		});
	} catch (error) {
		console.error("Failed to invite riders:", error);
		return formatError(
			res,
			500,
			"Failed to send invitations",
			"RIDE_INVITE_SEND_ERR",
		);
	}
};

exports.updateRide = async (req, res) => {
	try {
		const ride = await Ride.findByPk(req.params.rideId, {
			attributes: [
				"id",
				"creator_id",
				"status",
				"route_polygon",
				"created_at",
				"updated_at",
			],
		});

		if (!ride) {
			return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
		}

		// Check authorization: only the ride creator can edit
		if (ride.creator_id !== req.user.id) {
			return formatError(
				res,
				403,
				"Only the ride creator can edit this ride",
				"RIDE_EDIT_FORBIDDEN",
			);
		}

		// Only allow editing rides in pending status
		if (!["PLANNING", "PENDING"].includes(normalizeRideStatus(ride.status))) {
			return formatError(
				res,
				400,
				"Can only edit rides before they start",
				"RIDE_EDIT_NOT_ALLOWED",
			);
		}

		const {
			rideType,
			privacy,
			rideTitle,
			source,
			destination,
			pickupLocation,
			dropLocation,
			startDate,
			endDate,
			days,
			budget,
			maxRiders,
			ridePace,
			roadPreference,
			meetupNotes,
			emergencyContactName,
			emergencyContactPhone,
			rideNotes,
			includesFood,
			includesFuel,
			bikeProvided,
			stayArranged,
			stayDetails,
			invitedFriendIds,
		} = req.body;

		if (!source || !destination) {
			return formatError(
				res,
				400,
				"source and destination are required",
				"RIDE_LOC_REQUIRED",
			);
		}

		if (!startDate) {
			return formatError(
				res,
				400,
				"startDate is required",
				"RIDE_START_REQUIRED",
			);
		}

		const details = {
			rideType: rideType || ride.route_polygon.rideType,
			privacy:
				privacy !== undefined ? privacy : ride.route_polygon.privacy || "mixed",
			rideTitle:
				rideTitle !== undefined
					? rideTitle
					: ride.route_polygon.rideTitle || "",
			source,
			destination,
			pickupLocation: pickupLocation || source,
			dropLocation: dropLocation || destination,
			startDate,
			endDate: endDate || null,
			days: Number(days || ride.route_polygon.days || 1),
			budget: Number(budget || ride.route_polygon.budget || 0),
			maxRiders: Number(maxRiders || ride.route_polygon.maxRiders || 0),
			ridePace: ridePace || ride.route_polygon.ridePace || "balanced",
			roadPreference:
				roadPreference || ride.route_polygon.roadPreference || "mixed",
			meetupNotes:
				meetupNotes !== undefined
					? meetupNotes
					: ride.route_polygon.meetupNotes || "",
			emergencyContactName:
				emergencyContactName !== undefined
					? emergencyContactName
					: ride.route_polygon.emergencyContactName || "",
			emergencyContactPhone:
				emergencyContactPhone !== undefined
					? emergencyContactPhone
					: ride.route_polygon.emergencyContactPhone || "",
			rideNotes:
				rideNotes !== undefined
					? rideNotes
					: ride.route_polygon.rideNotes || "",
			includesFood:
				includesFood !== undefined
					? Boolean(includesFood)
					: Boolean(ride.route_polygon.includesFood),
			includesFuel:
				includesFuel !== undefined
					? Boolean(includesFuel)
					: Boolean(ride.route_polygon.includesFuel),
			bikeProvided:
				bikeProvided !== undefined
					? Boolean(bikeProvided)
					: Boolean(ride.route_polygon.bikeProvided),
			stayArranged:
				stayArranged !== undefined
					? Boolean(stayArranged)
					: Boolean(ride.route_polygon.stayArranged),
			stayDetails: (
				stayArranged !== undefined
					? stayArranged
					: ride.route_polygon.stayArranged
			)
				? stayDetails || ""
				: "",
		};

		ride.route_polygon = details;
		await ride.save();

		// Update invited friends if provided
		if (Array.isArray(invitedFriendIds) && details.rideType === "group") {
			// Remove all INVITED participants
			await RideParticipant.destroy({
				where: {
					ride_id: ride.id,
					status: "INVITED",
				},
			});

			// Add new invites
			if (invitedFriendIds.length > 0) {
				await RideParticipant.bulkCreate(
					invitedFriendIds.map((friendId) => ({
						ride_id: ride.id,
						rider_id: friendId,
						status: "INVITED",
					})),
					{ ignoreDuplicates: true },
				);
			}
		}

		const participants = await RideParticipant.findAll({
			where: { ride_id: ride.id },
			attributes: ["rider_id", "status"],
		});

		return res.status(200).json({
			success: true,
			data: {
				ride: toRidePayload(
					ride,
					participants.map((entry) => ({
						riderId: entry.rider_id,
						status: entry.status,
					})),
					{ organizerId: req.user.id, currentUserId: req.user.id },
				),
			},
		});
	} catch (error) {
		console.error("updateRide error", error);
		return formatError(res, 500, "Failed to update ride", "RIDE_UPDATE_ERR");
	}
};

exports.deleteRide = async (req, res) => {
	try {
		const ride = await Ride.findByPk(req.params.rideId, {
			attributes: ["id", "creator_id", "status"],
		});

		if (!ride) {
			return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
		}

		// Check authorization: only the ride creator can delete
		if (ride.creator_id !== req.user.id) {
			return formatError(
				res,
				403,
				"Only the ride creator can delete this ride",
				"RIDE_DELETE_FORBIDDEN",
			);
		}

		// Only allow deleting rides before they start
		if (!["PLANNING", "PENDING"].includes(normalizeRideStatus(ride.status))) {
			return formatError(
				res,
				400,
				"Can only delete rides before they start",
				"RIDE_DELETE_NOT_ALLOWED",
			);
		}

		// Clean up related records
		await Promise.all([
			RideParticipant.destroy({
				where: { ride_id: ride.id },
			}),
		]);

		// Delete the ride
		await ride.destroy();

		return res.status(200).json({
			success: true,
			data: { rideId: req.params.rideId, deleted: true },
		});
	} catch (error) {
		console.error("deleteRide error", error);
		return formatError(res, 500, "Failed to delete ride", "RIDE_DELETE_ERR");
	}
};
