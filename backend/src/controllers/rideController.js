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

const toRidePayload = (ride, participants = []) => ({
	id: ride.id,
	communityId: ride.community_id,
	status: ride.status,
	details: ride.route_polygon || {},
	participants,
	createdAt: ride.created_at,
	updatedAt: ride.updated_at,
});

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
			source,
			destination,
			pickupLocation,
			dropLocation,
			startDate,
			endDate,
			days,
			budget,
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
			source,
			destination,
			pickupLocation: pickupLocation || source,
			dropLocation: dropLocation || destination,
			startDate,
			endDate: endDate || null,
			days: Number(days || 1),
			budget: Number(budget || 0),
			includesFood: Boolean(includesFood),
			includesFuel: Boolean(includesFuel),
			bikeProvided: Boolean(bikeProvided),
			stayArranged: Boolean(stayArranged),
			stayDetails: stayArranged ? stayDetails || "" : "",
		};

		const ride = await Ride.create({
			community_id: resolvedCommunityId,
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

	return res.status(200).json({
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

	const myRides = groupRides.filter((ride) =>
		(byRide[ride.id] || []).some((item) => item.rider_id === req.user.id),
	);

	const activeRide = myRides.find((item) => item.status === "ACTIVE") || null;

	return res.status(200).json({
		success: true,
		data: {
			activeRide,
			nearbyRides: groupRides.filter((ride) => ride.status !== "COMPLETED"),
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
	const ride = await Ride.findByPk(req.params.rideId);

	if (!ride) {
		return formatError(res, 404, "Ride not found", "RIDE_NOT_FOUND");
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
