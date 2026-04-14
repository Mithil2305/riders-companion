const admin = require("../config/firebaseAdmin");
const { RiderAccount } = require("../models");
const { formatError } = require("../utils/errorFormatter");

module.exports = async (req, res, next) => {
	const authHeader = req.headers.authorization || "";
	const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;

	if (!token) {
		return formatError(res, 401, "No token provided", "AUTH_MISSING_TOKEN");
	}

	try {
		const decodedToken = await admin.auth().verifyIdToken(token);
		const user = await RiderAccount.findOne({ where: { firebase_uid: decodedToken.uid } });

		if (!user) {
			return formatError(res, 404, "User profile not found", "AUTH_USER_NOT_FOUND");
		}

		req.user = user;
		next();
	} catch (_error) {
		return formatError(res, 401, "Invalid or expired token", "AUTH_INVALID_TOKEN");
	}
};
