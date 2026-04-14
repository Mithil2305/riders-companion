const isFiniteNumber = (value) =>
	typeof value === "number" && Number.isFinite(value);

const normalizePoint = (point) => {
	if (!Array.isArray(point) || point.length < 2) {
		return null;
	}

	const lon = Number(point[0]);
	const lat = Number(point[1]);

	if (!isFiniteNumber(lat) || !isFiniteNumber(lon)) {
		return null;
	}

	return [lon, lat];
};

const extractPolygonCoordinates = (polygonInput) => {
	if (Array.isArray(polygonInput)) {
		return polygonInput;
	}

	if (
		polygonInput &&
		typeof polygonInput === "object" &&
		polygonInput.type === "Polygon" &&
		Array.isArray(polygonInput.coordinates)
	) {
		return polygonInput.coordinates[0] || [];
	}

	if (
		polygonInput &&
		typeof polygonInput === "object" &&
		Array.isArray(polygonInput.polygon)
	) {
		return polygonInput.polygon;
	}

	return [];
};

const normalizePolygon = (polygonInput) => {
	const points = extractPolygonCoordinates(polygonInput)
		.map(normalizePoint)
		.filter(Boolean);

	if (points.length < 3) {
		return [];
	}

	const first = points[0];
	const last = points[points.length - 1];
	if (first[0] !== last[0] || first[1] !== last[1]) {
		points.push([...first]);
	}

	return points;
};

const isInsidePolygon = ({ latitude, longitude }, polygonInput) => {
	if (!isFiniteNumber(latitude) || !isFiniteNumber(longitude)) {
		return false;
	}

	const polygon = normalizePolygon(polygonInput);
	if (polygon.length < 4) {
		return false;
	}

	let inside = false;

	for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
		const xi = polygon[i][0];
		const yi = polygon[i][1];
		const xj = polygon[j][0];
		const yj = polygon[j][1];

		const intersects =
			yi > latitude !== yj > latitude &&
			longitude <
				((xj - xi) * (latitude - yi)) / (yj - yi + Number.EPSILON) + xi;

		if (intersects) {
			inside = !inside;
		}
	}

	return inside;
};

const resolveParticipantStatus = ({ latitude, longitude }, polygonInput) => {
	if (!polygonInput) {
		return "IN_ZONE";
	}

	return isInsidePolygon({ latitude, longitude }, polygonInput)
		? "IN_ZONE"
		: "OUT_OF_ZONE";
};

module.exports = {
	normalizePolygon,
	isInsidePolygon,
	resolveParticipantStatus,
};
