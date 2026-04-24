exports.formatError = (res, statusCode, message, errorCode = "INTERNAL_ERROR") => {
	return res.status(statusCode).json({
		success: false,
		message,
		code: errorCode,
	});
};
