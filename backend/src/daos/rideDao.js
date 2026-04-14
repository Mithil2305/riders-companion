const { Op } = require("sequelize");
const { Ride, RideParticipant } = require("../models");

const participantAttributes = [
	"id",
	"ride_id",
	"rider_id",
	"status",
	"created_at",
];

const toParticipantPayload = (participant) => ({
	id: participant.id,
	rideId: participant.ride_id,
	riderId: participant.rider_id,
	status: participant.status,
	createdAt: participant.created_at,
});

exports.createRide = async (
	{ communityId, status = "PLANNING", routePolygon = null },
	options = {},
) => {
	return Ride.create(
		{
			community_id: communityId,
			status,
			route_polygon: routePolygon,
		},
		{ transaction: options.transaction },
	);
};

exports.findRideById = async (rideId, options = {}) => {
	if (!rideId) {
		return null;
	}

	return Ride.findByPk(rideId, {
		transaction: options.transaction,
	});
};

exports.listRides = async ({ status, limit = 50 } = {}, options = {}) => {
	const where = {};
	if (typeof status === "string" && status.length > 0) {
		where.status = status;
	}

	return Ride.findAll({
		where,
		order: [["created_at", "DESC"]],
		limit,
		transaction: options.transaction,
	});
};

exports.addParticipant = async (
	{ rideId, riderId, status = "CONFIRMED" },
	options = {},
) => {
	return RideParticipant.create(
		{
			ride_id: rideId,
			rider_id: riderId,
			status,
		},
		{ transaction: options.transaction },
	);
};

exports.bulkInviteParticipants = async (
	{ rideId, riderIds = [], status = "INVITED" },
	options = {},
) => {
	if (!Array.isArray(riderIds) || riderIds.length === 0) {
		return [];
	}

	return RideParticipant.bulkCreate(
		riderIds.map((riderId) => ({
			ride_id: rideId,
			rider_id: riderId,
			status,
		})),
		{
			ignoreDuplicates: true,
			transaction: options.transaction,
		},
	);
};

exports.findParticipant = async ({ rideId, riderId }, options = {}) => {
	return RideParticipant.findOne({
		where: {
			ride_id: rideId,
			rider_id: riderId,
		},
		attributes: options.attributes || participantAttributes,
		transaction: options.transaction,
	});
};

exports.findRideParticipants = async (rideId, options = {}) => {
	if (!rideId) {
		return [];
	}

	const participants = await RideParticipant.findAll({
		where: { ride_id: rideId },
		attributes: options.attributes || participantAttributes,
		order: [["created_at", "ASC"]],
		transaction: options.transaction,
	});

	return participants.map(toParticipantPayload);
};

exports.updateRideStatus = async (rideId, status, options = {}) => {
	const ride = await Ride.findByPk(rideId, {
		transaction: options.transaction,
	});
	if (!ride) {
		return null;
	}

	ride.status = status;
	await ride.save({ transaction: options.transaction });
	return ride;
};

exports.updateParticipantStatus = async (
	{ rideId, riderId, status },
	options = {},
) => {
	const participant = await RideParticipant.findOne({
		where: {
			ride_id: rideId,
			rider_id: riderId,
		},
		transaction: options.transaction,
	});

	if (!participant) {
		return null;
	}

	participant.status = status;
	await participant.save({ transaction: options.transaction });
	return participant;
};

exports.updateParticipantsStatusByRide = async (
	{ rideId, fromStatuses = [], toStatus },
	options = {},
) => {
	if (!Array.isArray(fromStatuses) || fromStatuses.length === 0) {
		return 0;
	}

	const [updatedCount] = await RideParticipant.update(
		{ status: toStatus },
		{
			where: {
				ride_id: rideId,
				status: { [Op.in]: fromStatuses },
			},
			transaction: options.transaction,
		},
	);

	return updatedCount;
};

exports.removeParticipant = async ({ rideId, riderId }, options = {}) => {
	return RideParticipant.destroy({
		where: {
			ride_id: rideId,
			rider_id: riderId,
		},
		transaction: options.transaction,
	});
};
