const admin = require("../config/firebaseAdmin");
const { RiderAccount } = require("../models");

class AuthServiceError extends Error {
	constructor(statusCode, message, code) {
		super(message);
		this.statusCode = statusCode;
		this.code = code;
	}
}

const normalizeUsername = (value) => value.trim().toLowerCase();

const toAuthUser = (user) => ({
	id: user.id,
	firebaseUid: user.firebase_uid,
	email: user.email,
	username: user.username,
	name: user.name,
	bio: user.bio,
	mobileNumber: user.mobile_number,
	driverLicenseNumber: user.driver_license_number,
	profileImageUrl: user.profile_image_url,
	bannerImageUrl: user.banner_image_url,
	totalMiles: user.total_miles,
	profileSetupCompletedAt: user.profile_setup_completed_at,
	createdAt: user.created_at,
	updatedAt: user.updated_at,
});

exports.serializeAuthUser = toAuthUser;

const verifyToken = async (idToken) => {
	if (!idToken || typeof idToken !== "string") {
		throw new AuthServiceError(
			400,
			"idToken is required",
			"AUTH_MISSING_ID_TOKEN",
		);
	}

	try {
		return await admin.auth().verifyIdToken(idToken);
	} catch (_error) {
		throw new AuthServiceError(
			401,
			"Invalid Firebase token",
			"AUTH_INVALID_TOKEN",
		);
	}
};

exports.signup = async ({ idToken, name, username, mobileNumber }) => {
	if (!name || typeof name !== "string" || !name.trim()) {
		throw new AuthServiceError(400, "name is required", "AUTH_INVALID_NAME");
	}

	if (!username || typeof username !== "string" || !username.trim()) {
		throw new AuthServiceError(
			400,
			"username is required",
			"AUTH_INVALID_USERNAME",
		);
	}

	const normalizedUsername = normalizeUsername(username);
	if (!/^[a-z0-9_]{3,50}$/.test(normalizedUsername)) {
		throw new AuthServiceError(
			400,
			"username must be 3-50 chars and contain only letters, numbers, or underscores",
			"AUTH_INVALID_USERNAME_FORMAT",
		);
	}

	const decodedToken = await verifyToken(idToken);

	if (!decodedToken.email) {
		throw new AuthServiceError(
			400,
			"Firebase account email is required",
			"AUTH_EMAIL_MISSING",
		);
	}

	const existingByUid = await RiderAccount.findOne({
		where: { firebase_uid: decodedToken.uid },
	});

	if (existingByUid) {
		throw new AuthServiceError(
			409,
			"Account already exists",
			"AUTH_ACCOUNT_EXISTS",
		);
	}

	const existingByUsername = await RiderAccount.findOne({
		where: { username: normalizedUsername },
	});

	if (existingByUsername) {
		throw new AuthServiceError(
			409,
			"Username already taken",
			"AUTH_USERNAME_EXISTS",
		);
	}

<<<<<<< HEAD
=======
	const existingByEmail = await RiderAccount.findOne({
		where: { email: decodedToken.email },
	});

	if (existingByEmail) {
		throw new AuthServiceError(
			409,
			"Email already registered",
			"AUTH_EMAIL_EXISTS",
		);
	}

>>>>>>> cb3f167d96cf0daedb34e800dcf9590b155e87c0
	const user = await RiderAccount.create({
		firebase_uid: decodedToken.uid,
		email: decodedToken.email,
		username: normalizedUsername,
		name: name.trim(),
		mobile_number:
			typeof mobileNumber === "string" && mobileNumber.trim().length > 0
				? mobileNumber.trim()
				: null,
	});

	return {
		token: idToken,
		user: toAuthUser(user),
	};
};

exports.login = async ({ idToken }) => {
	const decodedToken = await verifyToken(idToken);

	const user = await RiderAccount.findOne({
		where: { firebase_uid: decodedToken.uid },
	});

	if (!user) {
		throw new AuthServiceError(
			404,
			"Profile not found. Please complete signup first.",
			"AUTH_USER_NOT_FOUND",
		);
	}

	return {
		token: idToken,
		user: toAuthUser(user),
	};
};

exports.AuthServiceError = AuthServiceError;
