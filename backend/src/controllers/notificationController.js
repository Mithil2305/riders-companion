const { Op } = require("sequelize");
const { Ride, RideParticipant } = require("../models");

exports.listNotifications = async (req, res) => {
	const participantRows = await RideParticipant.findAll({
		where: { rider_id: req.user.id },
		attributes: ["ride_id", "status", "updated_at"],
		order: [["updated_at", "DESC"]],
		limit: 100,
	});

	const rideIds = participantRows.map((item) => item.ride_id);
	if (rideIds.length === 0) {
		return res.status(200).json({ success: true, data: { notifications: [] } });
	}

	const rides = await Ride.findAll({
		where: { id: { [Op.in]: rideIds } },
		attributes: ["id", "status", "route_polygon"],
	});

	const byRideId = rides.reduce((acc, ride) => {
		acc[ride.id] = ride;
		return acc;
	}, {});

	const notifications = participantRows
		.map((participant) => {
			const ride = byRideId[participant.ride_id];
			if (!ride) {
				return null;
			}

			const details = ride.route_polygon || {};
			if (details.rideType !== "group") {
				return null;
			}

			if (participant.status === "INVITED") {
				return {
					id: `ride-invite-${ride.id}`,
					title: "Group ride invitation",
					body: `${details.source || "Source"} -> ${details.destination || "Destination"}`,
					type: "invite",
					read: false,
					createdAt: participant.updated_at,
					rideId: ride.id,
				};
			}

			if (ride.status === "ACTIVE") {
				return {
					id: `ride-active-${ride.id}`,
					title: "Group ride is live",
					body: `${details.source || "Source"} -> ${details.destination || "Destination"}`,
					type: "status",
					read: false,
					createdAt: participant.updated_at,
					rideId: ride.id,
				};
			}

			return null;
		})
		.filter(Boolean);

	return res.status(200).json({ success: true, data: { notifications } });
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
