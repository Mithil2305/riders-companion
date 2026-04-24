const { RiderAccount } = require("../models");

const defaultProfileAttributes = [
	"id",
	"firebase_uid",
	"email",
	"username",
	"name",
	"bio",
	"mobile_number",
	"driver_license_number",
	"profile_image_url",
	"banner_image_url",
	"total_miles",
	"profile_setup_completed_at",
	"created_at",
	"updated_at",
];

const normalizeUsername = (value) => value.trim().toLowerCase();

exports.findById = async (riderId, options = {}) => {
	if (!riderId) {
		return null;
	}

	return RiderAccount.findByPk(riderId, {
		attributes: options.attributes || defaultProfileAttributes,
		transaction: options.transaction,
	});
};

exports.findByFirebaseUid = async (firebaseUid, options = {}) => {
	if (!firebaseUid || typeof firebaseUid !== "string") {
		return null;
	}

	return RiderAccount.findOne({
		where: { firebase_uid: firebaseUid },
		attributes: options.attributes || defaultProfileAttributes,
		transaction: options.transaction,
	});
};

exports.findByEmail = async (email, options = {}) => {
	if (!email || typeof email !== "string") {
		return null;
	}

	return RiderAccount.findOne({
		where: { email: email.trim().toLowerCase() },
		attributes: options.attributes || defaultProfileAttributes,
		transaction: options.transaction,
	});
};

exports.findByUsername = async (username, options = {}) => {
	if (!username || typeof username !== "string") {
		return null;
	}

	return RiderAccount.findOne({
		where: { username: normalizeUsername(username) },
		attributes: options.attributes || defaultProfileAttributes,
		transaction: options.transaction,
	});
};

exports.createRider = async (
	{ firebaseUid, email, username, name, mobileNumber = null },
	options = {},
) => {
	return RiderAccount.create(
		{
			firebase_uid: firebaseUid,
			email: email.trim().toLowerCase(),
			username: normalizeUsername(username),
			name: name.trim(),
			mobile_number:
				typeof mobileNumber === "string" && mobileNumber.trim().length > 0
					? mobileNumber.trim()
					: null,
		},
		{ transaction: options.transaction },
	);
};

exports.updateProfile = async (riderId, patch, options = {}) => {
	const user = await RiderAccount.findByPk(riderId, {
		transaction: options.transaction,
	});

	if (!user) {
		return null;
	}

	if (typeof patch.name === "string" && patch.name.trim().length > 0) {
		user.name = patch.name.trim();
	}

	if (typeof patch.username === "string" && patch.username.trim().length > 0) {
		user.username = normalizeUsername(patch.username);
	}

	if (typeof patch.bio === "string") {
		user.bio = patch.bio.trim();
	}

	if (typeof patch.mobileNumber === "string") {
		user.mobile_number = patch.mobileNumber.trim();
	}

	if (typeof patch.driverLicenseNumber === "string") {
		user.driver_license_number = patch.driverLicenseNumber.trim();
	}

	if (
		typeof patch.profileImageUrl === "string" &&
		patch.profileImageUrl.trim()
	) {
		user.profile_image_url = patch.profileImageUrl.trim();
	}

	if (typeof patch.bannerImageUrl === "string" && patch.bannerImageUrl.trim()) {
		user.banner_image_url = patch.bannerImageUrl.trim();
	}

	if (
		!user.profile_setup_completed_at &&
		user.name &&
		user.username &&
		user.driver_license_number
	) {
		user.profile_setup_completed_at = new Date();
	}

	await user.save({ transaction: options.transaction });
	return user;
};

exports.incrementTotalMiles = async (riderId, miles, options = {}) => {
	if (typeof miles !== "number" || !Number.isFinite(miles)) {
		throw new Error("miles must be a finite number");
	}

	const user = await RiderAccount.findByPk(riderId, {
		transaction: options.transaction,
	});

	if (!user) {
		return null;
	}

	const currentMiles = Number(user.total_miles || 0);
	user.total_miles = Math.max(0, currentMiles + miles);
	await user.save({ transaction: options.transaction });

	return user;
};

exports.defaultProfileAttributes = defaultProfileAttributes;
