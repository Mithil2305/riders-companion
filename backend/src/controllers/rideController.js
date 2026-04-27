const { Op } = require("sequelize");
const {
	Community,
	Friend,
	Ride,
	RideParticipant,
	RiderAccount,
} = require("../models");
const { formatError } = require("../utils/errorFormatter");
const { canCreateContentOrRide } = require("../utils/profileAccess");

const liveLocationsByRide = new Map();

const toRidePayload = (ride, participants = [], options = {}) => {
	const organizerId = options.organizerId || ride.creator_id || null;
	return {
		id: ride.id,
		communityId: ride.community_id,
		status: ride.status,
		details: ride.route_polygon || {},
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
			status: "PLANNING",
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
		.map((ride) => ({
			communityId: ride.community_id,
			id: ride.id,
			status: ride.status,
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

	const [participant, created] = await RideParticipant.findOrCreate({
		where: { ride_id: ride.id, rider_id: req.user.id },
		defaults: { status: "CONFIRMED" },
	});

	if (!created && participant.status !== "CONFIRMED") {
		participant.status = "CONFIRMED";
		await participant.save();
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

	return res.status(200).json({ success: true, data: { accepted: false } });
};

exports.leaveRide = async (req, res) => {
	await RideParticipant.destroy({
		where: { ride_id: req.params.rideId, rider_id: req.user.id },
	});

	return res.status(200).json({
		success: true,
		data: { rideId: req.params.rideId, joined: false },
	});
};

exports.startRide = async (req, res) => {
	const ride = await Ride.findByPk(req.params.rideId, {
		attributes: ["id", "creator_id", "status"],
	});

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
	}

	// Check authorization: only the ride creator can start the ride
	if (ride.creator_id !== req.user.id) {
		return formatError(
			res,
			403,
			"Only the ride creator can start this ride",
			"RIDE_START_FORBIDDEN",
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
	const { latitude, longitude } = req.body;

	if (typeof latitude !== "number" || typeof longitude !== "number") {
		return formatError(
			res,
			400,
			"latitude and longitude are required",
			"RIDE_LOC_INVALID",
		);
	}

	if (!liveLocationsByRide.has(req.params.rideId)) {
		liveLocationsByRide.set(req.params.rideId, new Map());
	}

	liveLocationsByRide.get(req.params.rideId).set(req.user.id, {
		riderId: req.user.id,
		name: req.user.name,
		latitude,
		longitude,
		updatedAt: new Date().toISOString(),
	});

	return res.status(200).json({ success: true, data: { updated: true } });
};

exports.getRideLocations = async (req, res) => {
	const rideLocations = liveLocationsByRide.get(req.params.rideId);

	return res.status(200).json({
		success: true,
		data: {
			locations: rideLocations ? Array.from(rideLocations.values()) : [],
			refreshIntervalMinutes: 15,
		},
	});
};

exports.getRideReports = async (req, res) => {
	return res
		.status(200)
		.json({ success: true, data: { rideId: req.params.rideId, reports: [] } });
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

		// Only allow editing rides in PLANNING status
		if (ride.status !== "PLANNING") {
			return formatError(
				res,
				400,
				"Can only edit rides in PLANNING status",
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

		// Only allow deleting rides in PLANNING status
		if (ride.status !== "PLANNING") {
			return formatError(
				res,
				400,
				"Can only delete rides in PLANNING status",
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
