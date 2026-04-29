const { Op } = require("sequelize");
const {
	Ride,
	RideParticipant,
	RideLocationPoint,
	RiderAccount,
	Community,
} = require("../models");
const {
	haversineDistanceMeters,
	calculateSpeedKmh,
} = require("../services/telemetryService");

const LOCATION_EVENTS = new Set([
	"RIDE_JOIN",
	"RIDE_LEAVE",
	"LOCATION_UPDATE",
	"SOS_ALERT",
	"RIDE_SNAPSHOT",
]);

const MAX_HISTORY_PER_RIDER = 120;
const MAX_REASONABLE_SPEED_KMH = 220;
const ONLINE_THRESHOLD_MS = 30000;

const ensureRoomSet = (rooms, roomId) => {
	if (!rooms.has(roomId)) {
		rooms.set(roomId, new Set());
	}
	return rooms.get(roomId);
};

const ensureRoomLocations = (latestRideLocations, rideId) => {
	if (!latestRideLocations.has(rideId)) {
		latestRideLocations.set(rideId, new Map());
	}
	return latestRideLocations.get(rideId);
};

const ensurePresenceSet = (ridePresence, rideId) => {
	if (!ridePresence.has(rideId)) {
		ridePresence.set(rideId, new Set());
	}

	return ridePresence.get(rideId);
};

const broadcastToRoom = ({
	state,
	rideId,
	type,
	payload,
	sendToSocket,
	exclude,
}) => {
	const roomSockets = state.rideRooms.get(rideId);
	if (!roomSockets || roomSockets.size === 0) {
		return;
	}

	for (const socket of roomSockets) {
		if (exclude && socket === exclude) {
			continue;
		}

		sendToSocket(socket, type, payload);
	}
};

const validateRideAccess = async ({ riderId, rideId }) => {
	const ride = await Ride.findByPk(rideId, {
		attributes: ["id", "status", "community_id", "route_polygon", "creator_id"],
	});
	if (!ride) {
		return { allowed: false, reason: "Ride not found", code: "RIDE_NOT_FOUND" };
	}

	const participant = await RideParticipant.findOne({
		where: {
			ride_id: rideId,
			rider_id: riderId,
			status: {
				[Op.notIn]: ["DECLINED"],
			},
		},
		attributes: ["rider_id", "status"],
	});

	if (!participant) {
		return {
			allowed: false,
			reason: "You are not part of this ride",
			code: "RIDE_ACCESS_DENIED",
		};
	}

	return {
		allowed: true,
		ride,
		rideStatus: ride.status,
		participantStatus: participant.status,
	};
};

const parseTimestamp = (value) => {
	if (typeof value !== "string") {
		return new Date();
	}

	const parsed = new Date(value);
	if (Number.isNaN(parsed.getTime())) {
		return new Date();
	}

	return parsed;
};

const clampSpeed = (value) => {
	if (!isFiniteNumber(value) || value < 0) {
		return null;
	}

	return Math.min(value, MAX_REASONABLE_SPEED_KMH);
};

const normalizeOptionalNumber = (value) => {
	if (!isFiniteNumber(value)) {
		return null;
	}

	return value;
};

const getCommunityLeaderId = async (ride) => {
	if (!ride?.community_id) {
		return ride?.creator_id || null;
	}

	const community = await Community.findByPk(ride.community_id, {
		attributes: ["id", "creator_id"],
	});

	return community?.creator_id || ride?.creator_id || null;
};

const getAverageSpeedForRider = async (rideId, riderId) => {
	const points = await RideLocationPoint.findAll({
		where: { ride_id: rideId, rider_id: riderId },
		attributes: ["normalized_speed_kmh"],
		order: [["created_at", "DESC"]],
		limit: 20,
	});

	const values = points
		.map((entry) => entry.normalized_speed_kmh)
		.filter((value) => isFiniteNumber(value) && value >= 0);

	if (values.length === 0) {
		return null;
	}

	const total = values.reduce((sum, value) => sum + value, 0);
	return Number((total / values.length).toFixed(2));
};

const normalizeRouteMeta = (routePolygon) => {
	const details =
		routePolygon && typeof routePolygon === "object" ? routePolygon : {};
	const sourceCoordinates =
		details.sourceCoordinates &&
		isFiniteNumber(details.sourceCoordinates.latitude) &&
		isFiniteNumber(details.sourceCoordinates.longitude)
			? {
					latitude: details.sourceCoordinates.latitude,
					longitude: details.sourceCoordinates.longitude,
				}
			: null;

	const destinationCoordinates =
		details.destinationCoordinates &&
		isFiniteNumber(details.destinationCoordinates.latitude) &&
		isFiniteNumber(details.destinationCoordinates.longitude)
			? {
					latitude: details.destinationCoordinates.latitude,
					longitude: details.destinationCoordinates.longitude,
				}
			: null;

	return {
		source: typeof details.source === "string" ? details.source : null,
		destination:
			typeof details.destination === "string" ? details.destination : null,
		sourceCoordinates,
		destinationCoordinates,
		routePolyline: Array.isArray(details.routePolyline)
			? details.routePolyline.filter(
					(point) =>
						point &&
						isFiniteNumber(point.latitude) &&
						isFiniteNumber(point.longitude),
				)
			: [],
	};
};

const buildRideSnapshotPayload = async ({ rideId, state }) => {
	const ride = await Ride.findByPk(rideId, {
		attributes: ["id", "status", "community_id", "route_polygon", "creator_id"],
	});

	if (!ride) {
		return null;
	}

	const participants = await RideParticipant.findAll({
		where: {
			ride_id: rideId,
			status: {
				[Op.notIn]: ["DECLINED"],
			},
		},
		attributes: ["rider_id", "status"],
	});

	const riderIds = participants.map((entry) => entry.rider_id);
	const riders = riderIds.length
		? await RiderAccount.findAll({
				where: { id: { [Op.in]: riderIds } },
				attributes: ["id", "name", "username"],
			})
		: [];

	const riderById = new Map(riders.map((rider) => [rider.id, rider]));

	const latestPoints = await RideLocationPoint.findAll({
		where: {
			ride_id: rideId,
			is_latest: true,
		},
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

	const leaderId = await getCommunityLeaderId(ride);
	const onlineSet = state.ridePresence.get(rideId) || new Set();

	const locations = [];
	for (const point of latestPoints) {
		const rider = riderById.get(point.rider_id);
		const participant = participants.find(
			(entry) => entry.rider_id === point.rider_id,
		);
		const averageSpeedKmh = await getAverageSpeedForRider(
			rideId,
			point.rider_id,
		);
		const updatedAt = point.source_timestamp || point.created_at;
		const isOnlineBySocket = onlineSet.has(point.rider_id);
		const isOnlineByFreshUpdate =
			new Date(updatedAt).getTime() > Date.now() - ONLINE_THRESHOLD_MS;

		locations.push({
			rideId,
			riderId: point.rider_id,
			name: rider?.name || "Rider",
			username: rider?.username || null,
			latitude: point.latitude,
			longitude: point.longitude,
			deviceSpeedKmh: point.device_speed_kmh,
			speed: point.normalized_speed_kmh,
			averageSpeedKmh,
			heading: point.heading,
			accuracy: point.accuracy,
			altitude: point.altitude,
			timestamp: updatedAt,
			updatedAt,
			isLeader: leaderId === point.rider_id,
			isOnline: isOnlineBySocket || isOnlineByFreshUpdate,
			participantStatus: participant?.status || null,
			rideStatus: ride.status,
		});
	}

	const participantStates = participants.map((entry) => {
		const rider = riderById.get(entry.rider_id);
		return {
			riderId: entry.rider_id,
			name: rider?.name || "Rider",
			username: rider?.username || null,
			participantStatus: entry.status,
			isLeader: leaderId === entry.rider_id,
			isOnline: onlineSet.has(entry.rider_id),
		};
	});

	return {
		rideId,
		rideStatus: ride.status,
		leaderRiderId: leaderId,
		route: normalizeRouteMeta(ride.route_polygon),
		participants: participantStates,
		locations,
		snapshotAt: new Date().toISOString(),
	};
};

const handleRideJoin = async ({
	ws,
	payload,
	state,
	sendToSocket,
	sendError,
}) => {
	const rideId = payload?.rideId;
	if (!rideId || typeof rideId !== "string") {
		sendError(ws, "RIDE_JOIN_BAD_PAYLOAD", "rideId is required");
		return true;
	}

	const access = await validateRideAccess({ riderId: ws.rider.id, rideId });
	if (!access.allowed) {
		sendError(ws, access.code, access.reason, { rideId });
		return true;
	}

	if (String(access.rideStatus).toUpperCase() === "COMPLETED") {
		sendError(ws, "RIDE_ALREADY_ENDED", "Ride is already completed", {
			rideId,
		});
		return true;
	}

	const roomSet = ensureRoomSet(state.rideRooms, rideId);
	const alreadyJoined = ws.rideRooms.has(rideId);
	roomSet.add(ws);
	ws.rideRooms.add(rideId);
	ensurePresenceSet(state.ridePresence, rideId).add(ws.rider.id);

	const snapshot = await buildRideSnapshotPayload({ rideId, state });

	sendToSocket(ws, "RIDE_JOINED", {
		rideId,
		rideStatus: access.rideStatus,
		participantStatus: access.participantStatus,
		snapshot,
	});

	if (!alreadyJoined) {
		broadcastToRoom({
			state,
			rideId,
			type: "RIDE_PARTICIPANT_JOINED",
			payload: {
				rideId,
				riderId: ws.rider.id,
				name: ws.rider.name,
				username: ws.rider.username,
				isOnline: true,
			},
			sendToSocket,
			exclude: ws,
		});
	}

	return true;
};

const handleRideLeave = ({ ws, payload, state, sendToSocket, sendError }) => {
	const rideId = payload?.rideId;
	if (!rideId || typeof rideId !== "string") {
		sendError(ws, "RIDE_LEAVE_BAD_PAYLOAD", "rideId is required");
		return true;
	}

	const roomSet = state.rideRooms.get(rideId);
	if (roomSet) {
		roomSet.delete(ws);
		if (roomSet.size === 0) {
			state.rideRooms.delete(rideId);
			state.latestRideLocations.delete(rideId);
		}
	}

	ws.rideRooms.delete(rideId);
	const presenceSet = state.ridePresence.get(rideId);
	if (presenceSet) {
		presenceSet.delete(ws.rider.id);
		if (presenceSet.size === 0) {
			state.ridePresence.delete(rideId);
		}
	}

	broadcastToRoom({
		state,
		rideId,
		type: "RIDE_PARTICIPANT_LEFT",
		payload: {
			rideId,
			riderId: ws.rider.id,
			isOnline: false,
		},
		sendToSocket,
		exclude: ws,
	});

	sendToSocket(ws, "RIDE_LEFT", { rideId });
	return true;
};

const isFiniteNumber = (value) =>
	typeof value === "number" && Number.isFinite(value);

const handleLocationUpdate = async ({
	ws,
	payload,
	state,
	sendToSocket,
	sendError,
}) => {
	const rideId = payload?.rideId;
	const { latitude, longitude, speed, heading, accuracy, altitude, timestamp } =
		payload || {};

	if (!rideId || typeof rideId !== "string") {
		sendError(ws, "LOCATION_BAD_PAYLOAD", "rideId is required");
		return true;
	}

	if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
		sendError(
			ws,
			"LOCATION_BAD_COORDS",
			"latitude and longitude must be valid numbers",
			{ rideId },
		);
		return true;
	}

	if (!ws.rideRooms.has(rideId)) {
		const access = await validateRideAccess({ riderId: ws.rider.id, rideId });
		if (!access.allowed) {
			sendError(ws, access.code, access.reason, { rideId });
			return true;
		}

		if (String(access.rideStatus).toUpperCase() === "COMPLETED") {
			sendError(ws, "RIDE_ALREADY_ENDED", "Ride is already completed", {
				rideId,
			});
			return true;
		}

		const roomSet = ensureRoomSet(state.rideRooms, rideId);
		roomSet.add(ws);
		ws.rideRooms.add(rideId);
		ensurePresenceSet(state.ridePresence, rideId).add(ws.rider.id);
	}

	const access = await validateRideAccess({ riderId: ws.rider.id, rideId });
	if (!access.allowed) {
		sendError(ws, access.code, access.reason, { rideId });
		return true;
	}

	if (String(access.rideStatus).toUpperCase() === "COMPLETED") {
		sendError(ws, "RIDE_ALREADY_ENDED", "Ride is already completed", {
			rideId,
		});
		return true;
	}

	if (
		!["STARTED", "CONFIRMED"].includes(
			String(access.participantStatus).toUpperCase(),
		)
	) {
		sendError(
			ws,
			"RIDE_PARTICIPANT_STATUS_BLOCKED",
			"Participant is not allowed to publish location in current state",
			{ rideId, participantStatus: access.participantStatus },
		);
		return true;
	}

	const sourceTimestamp = parseTimestamp(timestamp);

	const previousPoint = await RideLocationPoint.findOne({
		where: {
			ride_id: rideId,
			rider_id: ws.rider.id,
			is_latest: true,
		},
		attributes: ["latitude", "longitude", "source_timestamp"],
		order: [["created_at", "DESC"]],
	});

	const normalizedDeviceSpeed = clampSpeed(speed);
	let computedSpeed = null;
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

		computedSpeed = clampSpeed(
			calculateSpeedKmh({
				distanceMeters,
				durationSeconds,
			}),
		);
	}

	const normalizedSpeed =
		normalizedDeviceSpeed != null ? normalizedDeviceSpeed : computedSpeed;

	await RideLocationPoint.update(
		{ is_latest: false },
		{
			where: {
				ride_id: rideId,
				rider_id: ws.rider.id,
				is_latest: true,
			},
		},
	);

	await RideLocationPoint.create({
		ride_id: rideId,
		rider_id: ws.rider.id,
		latitude,
		longitude,
		device_speed_kmh: normalizedDeviceSpeed,
		normalized_speed_kmh: normalizedSpeed,
		heading: normalizeOptionalNumber(heading),
		accuracy: normalizeOptionalNumber(accuracy),
		altitude: isFiniteNumber(altitude) ? altitude : null,
		source_timestamp: sourceTimestamp,
		is_latest: true,
	});

	const stalePoints = await RideLocationPoint.findAll({
		where: { ride_id: rideId, rider_id: ws.rider.id },
		order: [["created_at", "DESC"]],
		offset: MAX_HISTORY_PER_RIDER,
		attributes: ["id"],
	});

	if (stalePoints.length > 0) {
		await RideLocationPoint.destroy({
			where: { id: { [Op.in]: stalePoints.map((entry) => entry.id) } },
		});
	}

	const location = {
		rideId,
		riderId: ws.rider.id,
		name: ws.rider.name,
		username: ws.rider.username,
		latitude,
		longitude,
		deviceSpeedKmh: normalizedDeviceSpeed,
		speed: normalizedSpeed,
		averageSpeedKmh: await getAverageSpeedForRider(rideId, ws.rider.id),
		heading: isFiniteNumber(heading) ? heading : null,
		accuracy: isFiniteNumber(accuracy) ? accuracy : null,
		altitude: isFiniteNumber(altitude) ? altitude : null,
		timestamp: sourceTimestamp.toISOString(),
		updatedAt: sourceTimestamp.toISOString(),
		participantStatus: access.participantStatus,
		rideStatus: access.rideStatus,
		isOnline: true,
	};

	const roomLocations = ensureRoomLocations(state.latestRideLocations, rideId);
	roomLocations.set(ws.rider.id, location);

	broadcastToRoom({
		state,
		rideId,
		type: "LOCATION_UPDATE",
		payload: location,
		sendToSocket,
	});

	return true;
};

const handleSosAlert = async ({
	ws,
	payload,
	state,
	sendToSocket,
	sendError,
}) => {
	const rideId = payload?.rideId;
	if (!rideId || typeof rideId !== "string") {
		sendError(ws, "SOS_BAD_PAYLOAD", "rideId is required");
		return true;
	}

	const access = await validateRideAccess({ riderId: ws.rider.id, rideId });
	if (!access.allowed) {
		sendError(ws, access.code, access.reason, { rideId });
		return true;
	}

	const alert = {
		rideId,
		riderId: ws.rider.id,
		name: ws.rider.name,
		username: ws.rider.username,
		message:
			typeof payload?.message === "string" ? payload.message : "SOS triggered",
		location:
			payload?.location &&
			isFiniteNumber(payload.location.latitude) &&
			isFiniteNumber(payload.location.longitude)
				? {
						latitude: payload.location.latitude,
						longitude: payload.location.longitude,
					}
				: null,
		issuedAt: new Date().toISOString(),
	};

	broadcastToRoom({
		state,
		rideId,
		type: "SOS_ALERT",
		payload: alert,
		sendToSocket,
	});

	return true;
};

const handleSnapshotRequest = ({
	ws,
	payload,
	state,
	sendToSocket,
	sendError,
}) => {
	const rideId = payload?.rideId;
	if (!rideId || typeof rideId !== "string") {
		sendError(ws, "SNAPSHOT_BAD_PAYLOAD", "rideId is required");
		return true;
	}

	void (async () => {
		const access = await validateRideAccess({ riderId: ws.rider.id, rideId });
		if (!access.allowed) {
			sendError(ws, access.code, access.reason, { rideId });
			return;
		}

		if (!ws.rideRooms.has(rideId)) {
			ensureRoomSet(state.rideRooms, rideId).add(ws);
			ws.rideRooms.add(rideId);
			ensurePresenceSet(state.ridePresence, rideId).add(ws.rider.id);
		}

		const snapshot = await buildRideSnapshotPayload({ rideId, state });
		sendToSocket(ws, "RIDE_SNAPSHOT", {
			rideId,
			snapshot,
		});
	})();

	return true;
};

exports.handleMessage = async ({
	ws,
	type,
	payload,
	state,
	sendToSocket,
	sendError,
}) => {
	if (!LOCATION_EVENTS.has(type)) {
		return false;
	}

	if (type === "RIDE_JOIN") {
		return handleRideJoin({ ws, payload, state, sendToSocket, sendError });
	}

	if (type === "RIDE_LEAVE") {
		return handleRideLeave({ ws, payload, state, sendToSocket, sendError });
	}

	if (type === "LOCATION_UPDATE") {
		return handleLocationUpdate({
			ws,
			payload,
			state,
			sendToSocket,
			sendError,
		});
	}

	if (type === "SOS_ALERT") {
		return handleSosAlert({ ws, payload, state, sendToSocket, sendError });
	}

	if (type === "RIDE_SNAPSHOT") {
		return handleSnapshotRequest({
			ws,
			payload,
			state,
			sendToSocket,
			sendError,
		});
	}

	return false;
};

exports.handleDisconnect = ({ ws, state, sendToSocket }) => {
	if (!ws || !ws.rider || !ws.rideRooms || ws.rideRooms.size === 0) {
		return;
	}

	for (const rideId of ws.rideRooms) {
		const roomSet = state.rideRooms.get(rideId);
		if (roomSet) {
			roomSet.delete(ws);
			if (roomSet.size === 0) {
				state.rideRooms.delete(rideId);
				state.latestRideLocations.delete(rideId);
			}
		}

		const presenceSet = state.ridePresence.get(rideId);
		if (presenceSet) {
			presenceSet.delete(ws.rider.id);
			if (presenceSet.size === 0) {
				state.ridePresence.delete(rideId);
			}
		}

		broadcastToRoom({
			state,
			rideId,
			type: "RIDE_PARTICIPANT_LEFT",
			payload: {
				rideId,
				riderId: ws.rider.id,
				isOnline: false,
			},
			sendToSocket,
		});
	}

	ws.rideRooms.clear();
};
