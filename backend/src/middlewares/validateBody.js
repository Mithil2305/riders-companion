const { formatError } = require("../utils/errorFormatter");

module.exports = (schema) => {
	return (req, res, next) => {
		let validationResult;

		if (typeof schema === "function") {
			validationResult = schema(req.body);
		} else if (schema && typeof schema.validate === "function") {
			validationResult = schema.validate(req.body);
		} else {
			return formatError(res, 500, "Invalid validation schema", "VALIDATION_SCHEMA_ERR");
		}

		if (validationResult?.error) {
			const message =
				typeof validationResult.error === "string"
					? validationResult.error
					: validationResult.error.message || "Invalid request body";

			return formatError(res, 400, message, "VALIDATION_ERROR");
		}

		next();
	};
};
