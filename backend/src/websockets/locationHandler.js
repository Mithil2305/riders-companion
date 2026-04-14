const { Op } = require("sequelize");
const { Ride, RideParticipant } = require("../models");

const LOCATION_EVENTS = new Set([
	"RIDE_JOIN",
	"RIDE_LEAVE",
	"LOCATION_UPDATE",
	"SOS_ALERT",
	"RIDE_SNAPSHOT",
]);

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
	const ride = await Ride.findByPk(rideId, { attributes: ["id", "status"] });
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
		rideStatus: ride.status,
		participantStatus: participant.status,
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

	const roomSet = ensureRoomSet(state.rideRooms, rideId);
	roomSet.add(ws);
	ws.rideRooms.add(rideId);

	const existingLocations = state.latestRideLocations.get(rideId);

	sendToSocket(ws, "RIDE_JOINED", {
		rideId,
		rideStatus: access.rideStatus,
		participantStatus: access.participantStatus,
		locations: existingLocations ? Array.from(existingLocations.values()) : [],
	});

	broadcastToRoom({
		state,
		rideId,
		type: "RIDE_PARTICIPANT_JOINED",
		payload: {
			rideId,
			riderId: ws.rider.id,
			name: ws.rider.name,
			username: ws.rider.username,
		},
		sendToSocket,
		exclude: ws,
	});

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

	broadcastToRoom({
		state,
		rideId,
		type: "RIDE_PARTICIPANT_LEFT",
		payload: {
			rideId,
			riderId: ws.rider.id,
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
	const { latitude, longitude, speed, heading, accuracy } = payload || {};

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

		const roomSet = ensureRoomSet(state.rideRooms, rideId);
		roomSet.add(ws);
		ws.rideRooms.add(rideId);
	}

	const location = {
		rideId,
		riderId: ws.rider.id,
		name: ws.rider.name,
		username: ws.rider.username,
		latitude,
		longitude,
		speed: isFiniteNumber(speed) ? speed : null,
		heading: isFiniteNumber(heading) ? heading : null,
		accuracy: isFiniteNumber(accuracy) ? accuracy : null,
		updatedAt: new Date().toISOString(),
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

	if (!ws.rideRooms.has(rideId)) {
		sendError(
			ws,
			"RIDE_ROOM_REQUIRED",
			"Join ride room before requesting snapshot",
			{
				rideId,
			},
		);
		return true;
	}

	const locations = state.latestRideLocations.get(rideId);

	sendToSocket(ws, "RIDE_SNAPSHOT", {
		rideId,
		locations: locations ? Array.from(locations.values()) : [],
	});

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

		broadcastToRoom({
			state,
			rideId,
			type: "RIDE_PARTICIPANT_LEFT",
			payload: {
				rideId,
				riderId: ws.rider.id,
			},
			sendToSocket,
		});
	}

	ws.rideRooms.clear();
};
