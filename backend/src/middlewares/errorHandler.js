/**
 * Global error handler middleware
 * Catches all unhandled errors and returns standardized error responses
 */
exports.errorHandler = (err, req, res, next) => {
	console.error("[ErrorHandler] Unhandled error:", {
		message: err.message,
		stack: err.stack,
		path: req.path,
		method: req.method,
	});

	// Default error response
	const statusCode = err.statusCode || err.status || 500;
	const message = err.message || "Internal server error";
	const errorCode = err.code || "INTERNAL_ERROR";

	// Don't leak error details in production
	const isDev = process.env.NODE_ENV === "development";

	return res.status(statusCode).json({
		success: false,
		message: isDev ? message : "Something went wrong",
		code: errorCode,
		...(isDev && { stack: err.stack }),
	});
};

/**
 * Async handler wrapper for controller functions
 * Automatically catches errors from async functions
 */
exports.asyncHandler = (fn) => {
	return (req, res, next) => {
		Promise.resolve(fn(req, res, next)).catch(next);
	};
};

/**
 * Not found handler for undefined routes
 */
exports.notFoundHandler = (req, res) => {
	return res.status(404).json({
		success: false,
		message: `Route ${req.method} ${req.path} not found`,
		code: "ROUTE_NOT_FOUND",
	});
};
