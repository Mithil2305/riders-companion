const authService = require("../services/authService");
const { formatError } = require("../utils/errorFormatter");

const handleAuthError = (res, error) => {
	if (error?.statusCode) {
		return formatError(res, error.statusCode, error.message, error.code);
	}

	return formatError(res, 500, "Authentication failed", "AUTH_INTERNAL_ERROR");
};

exports.signup = async (req, res) => {
	try {
		const { idToken, name, username } = req.body;
		const result = await authService.signup({ idToken, name, username });
		return res.status(201).json({ success: true, data: result });
	} catch (error) {
		return handleAuthError(res, error);
	}
};

exports.login = async (req, res) => {
	try {
		const { idToken } = req.body;
		const result = await authService.login({ idToken });
		return res.status(200).json({ success: true, data: result });
	} catch (error) {
		return handleAuthError(res, error);
	}
};

exports.getProfile = async (req, res) => {
	try {
		return res.status(200).json({
			success: true,
			data: {
				user: authService.serializeAuthUser(req.user),
			},
		});
	} catch (_error) {
		return formatError(
			res,
			500,
			"Failed to fetch profile",
			"AUTH_PROFILE_FETCH_ERR",
		);
	}
};
