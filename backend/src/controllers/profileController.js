const { formatError } = require("../utils/errorFormatter");
const { RiderAccount, UserBike } = require("../models");
const {
	mediaUploadError,
	uploadMediaFromBody,
} = require("../utils/mediaUpload");

const normalizeUsername = (value) => value.trim().toLowerCase();

const toProfilePayload = (user) => ({
	id: user.id,
	email: user.email,
	username: user.username,
	name: user.name,
	bio: user.bio,
	mobileNumber: user.mobile_number,
	driverLicenseNumber: user.driver_license_number,
	profileImageUrl: user.profile_image_url,
	bannerImageUrl: user.banner_image_url,
	profileSetupCompletedAt: user.profile_setup_completed_at,
	totalMiles: user.total_miles,
	createdAt: user.created_at,
	updatedAt: user.updated_at,
});

const toBikePayload = (bike) => ({
	id: bike.id,
	brand: bike.brand,
	model: bike.model,
	year: bike.year,
	bikeImageUrl: bike.bike_image_url,
	isPrimary: bike.is_primary,
});

const toPublicProfilePayload = (user) => ({
	id: user.id,
	username: user.username,
	name: user.name,
	bio: user.bio,
	profileImageUrl: user.profile_image_url,
});

exports.getRiderProfile = async (req, res) => {
	const riderId = req.params.riderId;

	if (typeof riderId !== "string" || riderId.trim().length === 0) {
		return formatError(
			res,
			400,
			"riderId is required",
			"PROFILE_RIDER_ID_REQUIRED",
		);
	}

	const rider = await RiderAccount.findByPk(riderId, {
		attributes: ["id", "username", "name", "bio", "profile_image_url"],
	});

	if (!rider) {
		return formatError(
			res,
			404,
			"Rider profile not found",
			"PROFILE_NOT_FOUND",
		);
	}

	return res.status(200).json({
		success: true,
		data: {
			profile: toPublicProfilePayload(rider),
		},
	});
};

exports.getMyProfile = async (req, res) => {
	const freshUser = await RiderAccount.findByPk(req.user.id);

	if (!freshUser) {
		return formatError(res, 404, "User profile not found", "PROFILE_NOT_FOUND");
	}

	const bikes = await UserBike.findAll({
		where: { rider_id: req.user.id },
		order: [
			["is_primary", "DESC"],
			["year", "DESC"],
		],
	});

	return res.status(200).json({
		success: true,
		data: {
			profile: toProfilePayload(freshUser),
			bikes: bikes.map(toBikePayload),
		},
	});
};

exports.updateMyProfile = async (req, res) => {
	try {
		const profileImage = await uploadMediaFromBody(req.body, {
			inputKeys: [
				"profileImageData",
				"profileImageBase64",
				"profileImageUrl",
				"avatarData",
				"avatarBase64",
				"avatarUrl",
			],
			mimeTypeKey: "profileImageMimeType",
			folder: "profiles",
			fallbackMimeType: "image/jpeg",
		});

		const bannerImage = await uploadMediaFromBody(req.body, {
			inputKeys: ["bannerImageData", "bannerImageBase64", "bannerImageUrl"],
			mimeTypeKey: "bannerImageMimeType",
			folder: "profiles",
			fallbackMimeType: "image/jpeg",
		});

		const { name, username, bio, mobileNumber, driverLicenseNumber } = req.body;

		if (typeof name === "string" && name.trim().length === 0) {
			return formatError(
				res,
				400,
				"name cannot be empty",
				"PROFILE_INVALID_NAME",
			);
		}

		if (typeof username === "string") {
			const normalized = normalizeUsername(username);
			if (!/^[a-z0-9_]{3,50}$/.test(normalized)) {
				return formatError(
					res,
					400,
					"username must be 3-50 chars and contain only letters, numbers, or underscores",
					"PROFILE_INVALID_USERNAME",
				);
			}

			const existingByUsername = await RiderAccount.findOne({
				where: { username: normalized },
			});

			if (existingByUsername && existingByUsername.id !== req.user.id) {
				return formatError(
					res,
					409,
					"Username already taken",
					"PROFILE_USERNAME_EXISTS",
				);
			}
		}

		const currentUser = await RiderAccount.findByPk(req.user.id);
		if (!currentUser) {
			return formatError(
				res,
				404,
				"User profile not found",
				"PROFILE_NOT_FOUND",
			);
		}

		currentUser.name =
			typeof name === "string" && name.trim().length > 0
				? name.trim()
				: currentUser.name;
		currentUser.username =
			typeof username === "string" && username.trim().length > 0
				? normalizeUsername(username)
				: currentUser.username;
		currentUser.bio = typeof bio === "string" ? bio.trim() : currentUser.bio;
		currentUser.mobile_number =
			typeof mobileNumber === "string"
				? mobileNumber.trim()
				: currentUser.mobile_number;
		currentUser.driver_license_number =
			typeof driverLicenseNumber === "string"
				? driverLicenseNumber.trim()
				: currentUser.driver_license_number;
		currentUser.profile_image_url =
			profileImage?.url ||
			req.body.profileImageUrl ||
			currentUser.profile_image_url;
		currentUser.banner_image_url =
			bannerImage?.url ||
			req.body.bannerImageUrl ||
			currentUser.banner_image_url;

		if (
			currentUser.name &&
			currentUser.username &&
			currentUser.driver_license_number
		) {
			currentUser.profile_setup_completed_at =
				currentUser.profile_setup_completed_at || new Date();
		}

		await currentUser.save();

		return res.status(200).json({
			success: true,
			data: {
				profile: toProfilePayload(currentUser),
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "PROFILE_MEDIA_UPLOAD_ERR");
		}

		return formatError(
			res,
			500,
			"Failed to update profile",
			"PROFILE_UPDATE_ERR",
		);
	}
};

exports.getGarageBikes = async (req, res) => {
	const bikes = await UserBike.findAll({
		where: { rider_id: req.user.id },
		order: [
			["is_primary", "DESC"],
			["year", "DESC"],
		],
	});

	return res.status(200).json({
		success: true,
		data: { bikes: bikes.map(toBikePayload) },
	});
};

exports.addGarageBike = async (req, res) => {
	try {
		const bikeImage = await uploadMediaFromBody(req.body, {
			inputKeys: [
				"bikeImageData",
				"bikeImageBase64",
				"bikeImageUrl",
				"imageData",
				"imageBase64",
				"imageUrl",
			],
			mimeTypeKey: "bikeImageMimeType",
			folder: "bikes",
			fallbackMimeType: "image/jpeg",
		});

		const { brand, model, year, isPrimary } = req.body;
		const parsedYear = Number(year);

		if (typeof brand !== "string" || brand.trim().length === 0) {
			return formatError(res, 400, "brand is required", "BIKE_BRAND_REQUIRED");
		}

		if (typeof model !== "string" || model.trim().length === 0) {
			return formatError(res, 400, "model is required", "BIKE_MODEL_REQUIRED");
		}

		if (
			!Number.isInteger(parsedYear) ||
			parsedYear < 1900 ||
			parsedYear > 2100
		) {
			return formatError(res, 400, "year is invalid", "BIKE_YEAR_INVALID");
		}

		if (Boolean(isPrimary)) {
			await UserBike.update(
				{ is_primary: false },
				{ where: { rider_id: req.user.id } },
			);
		}

		const createdBike = await UserBike.create({
			rider_id: req.user.id,
			brand: brand.trim(),
			model: model.trim(),
			year: parsedYear,
			bike_image_url: bikeImage?.url || req.body.bikeImageUrl || null,
			is_primary: Boolean(isPrimary),
		});

		return res.status(201).json({
			success: true,
			data: {
				bike: toBikePayload(createdBike),
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "BIKE_MEDIA_UPLOAD_ERR");
		}

		return formatError(res, 500, "Failed to add bike", "GARAGE_ADD_ERR");
	}
};

exports.updateGarageBike = async (req, res) => {
	try {
		const bikeImage = await uploadMediaFromBody(req.body, {
			inputKeys: [
				"bikeImageData",
				"bikeImageBase64",
				"bikeImageUrl",
				"imageData",
				"imageBase64",
				"imageUrl",
			],
			mimeTypeKey: "bikeImageMimeType",
			folder: "bikes",
			fallbackMimeType: "image/jpeg",
		});

		const bike = await UserBike.findOne({
			where: { id: req.params.bikeId, rider_id: req.user.id },
		});

		if (!bike) {
			return formatError(res, 404, "Bike not found", "BIKE_NOT_FOUND");
		}

		if (
			typeof req.body.brand === "string" &&
			req.body.brand.trim().length > 0
		) {
			bike.brand = req.body.brand.trim();
		}

		if (
			typeof req.body.model === "string" &&
			req.body.model.trim().length > 0
		) {
			bike.model = req.body.model.trim();
		}

		if (req.body.year != null) {
			const parsedYear = Number(req.body.year);
			if (
				!Number.isInteger(parsedYear) ||
				parsedYear < 1900 ||
				parsedYear > 2100
			) {
				return formatError(res, 400, "year is invalid", "BIKE_YEAR_INVALID");
			}
			bike.year = parsedYear;
		}

		if (req.body.isPrimary === true) {
			await UserBike.update(
				{ is_primary: false },
				{ where: { rider_id: req.user.id } },
			);
			bike.is_primary = true;
		}

		bike.bike_image_url =
			bikeImage?.url || req.body.bikeImageUrl || bike.bike_image_url;

		await bike.save();

		return res.status(200).json({
			success: true,
			data: {
				bike: toBikePayload(bike),
			},
		});
	} catch (error) {
		if (error instanceof Error && /upload|mime|media|R2/i.test(error.message)) {
			return mediaUploadError(res, error, "BIKE_MEDIA_UPLOAD_ERR");
		}

		return formatError(res, 500, "Failed to update bike", "GARAGE_UPDATE_ERR");
	}
};

exports.deleteGarageBike = async (req, res) => {
	const deletedCount = await UserBike.destroy({
		where: { id: req.params.bikeId, rider_id: req.user.id },
	});

	if (deletedCount === 0) {
		return formatError(res, 404, "Bike not found", "BIKE_NOT_FOUND");
	}

	return res.status(200).json({
		success: true,
		data: { bikeId: req.params.bikeId, deleted: true },
	});
};
