const EARTH_RADIUS_METERS = 6371000;

const toRadians = (degrees) => (degrees * Math.PI) / 180;

const isFiniteNumber = (value) =>
	typeof value === "number" && Number.isFinite(value);

const isLocationPoint = (point) =>
	point &&
	isFiniteNumber(point.latitude) &&
	isFiniteNumber(point.longitude) &&
	Boolean(point.timestamp);

const getTimestampMs = (timestamp) => {
	const value = new Date(timestamp).getTime();
	return Number.isFinite(value) ? value : null;
};

const haversineDistanceMeters = (from, to) => {
	if (!isLocationPoint(from) || !isLocationPoint(to)) {
		return 0;
	}

	const lat1 = toRadians(from.latitude);
	const lat2 = toRadians(to.latitude);
	const dLat = toRadians(to.latitude - from.latitude);
	const dLon = toRadians(to.longitude - from.longitude);

	const a =
		Math.sin(dLat / 2) * Math.sin(dLat / 2) +
		Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
	const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

	return EARTH_RADIUS_METERS * c;
};

const calculateSpeedKmh = ({ distanceMeters, durationSeconds }) => {
	if (
		!isFiniteNumber(distanceMeters) ||
		!isFiniteNumber(durationSeconds) ||
		durationSeconds <= 0
	) {
		return 0;
	}

	return (distanceMeters / durationSeconds) * 3.6;
};

const summarizeRideTelemetry = (points = []) => {
	if (!Array.isArray(points) || points.length < 2) {
		return {
			totalDistanceMeters: 0,
			totalDistanceKm: 0,
			durationSeconds: 0,
			averageSpeedKmh: 0,
			topSpeedKmh: 0,
		};
	}

	let totalDistanceMeters = 0;
	let topSpeedKmh = 0;

	const sorted = [...points]
		.filter(isLocationPoint)
		.sort((a, b) => getTimestampMs(a.timestamp) - getTimestampMs(b.timestamp));

	if (sorted.length < 2) {
		return {
			totalDistanceMeters: 0,
			totalDistanceKm: 0,
			durationSeconds: 0,
			averageSpeedKmh: 0,
			topSpeedKmh: 0,
		};
	}

	for (let i = 1; i < sorted.length; i += 1) {
		const previous = sorted[i - 1];
		const current = sorted[i];

		const segmentDistance = haversineDistanceMeters(previous, current);
		totalDistanceMeters += segmentDistance;

		const prevTs = getTimestampMs(previous.timestamp);
		const currTs = getTimestampMs(current.timestamp);
		const durationSeconds =
			prevTs != null && currTs != null ? (currTs - prevTs) / 1000 : 0;

		const segmentSpeed = calculateSpeedKmh({
			distanceMeters: segmentDistance,
			durationSeconds,
		});

		if (segmentSpeed > topSpeedKmh) {
			topSpeedKmh = segmentSpeed;
		}
	}

	const startTime = getTimestampMs(sorted[0].timestamp);
	const endTime = getTimestampMs(sorted[sorted.length - 1].timestamp);
	const durationSeconds =
		startTime != null && endTime != null && endTime > startTime
			? (endTime - startTime) / 1000
			: 0;

	const averageSpeedKmh = calculateSpeedKmh({
		distanceMeters: totalDistanceMeters,
		durationSeconds,
	});

	return {
		totalDistanceMeters,
		totalDistanceKm: totalDistanceMeters / 1000,
		durationSeconds,
		averageSpeedKmh,
		topSpeedKmh,
	};
};

const generateRideReport = async ({ rideId, riderId, points = [] }) => {
	const summary = summarizeRideTelemetry(points);

	return {
		rideId,
		riderId,
		topSpeed: Number(summary.topSpeedKmh.toFixed(2)),
		averageSpeed: Number(summary.averageSpeedKmh.toFixed(2)),
		distance: Number(summary.totalDistanceKm.toFixed(2)),
		durationSeconds: Math.round(summary.durationSeconds),
		badgesEarned: [],
	};
};

module.exports = {
	haversineDistanceMeters,
	calculateSpeedKmh,
	summarizeRideTelemetry,
	generateRideReport,
};
