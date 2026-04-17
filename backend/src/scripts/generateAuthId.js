const crypto = require("crypto");

const DEFAULT_BYTES = 48;

const parseByteLength = () => {
	const input = process.argv[2];
	if (!input) {
		return DEFAULT_BYTES;
	}

	const parsed = Number.parseInt(input, 10);
	if (!Number.isInteger(parsed) || parsed < 16 || parsed > 256) {
		throw new Error("Byte length must be an integer between 16 and 256");
	}

	return parsed;
};

const main = () => {
	try {
		const byteLength = parseByteLength();
		const authId = crypto.randomBytes(byteLength).toString("base64url");

		console.log("Generated CHAT_AUTH_ID (keep this secret):");
		console.log(`CHAT_AUTH_ID=${authId}`);
		console.log("\nTip: paste this value into backend/.env");
	} catch (error) {
		console.error(
			error instanceof Error
				? error.message
				: "Failed to generate CHAT_AUTH_ID",
		);
		process.exit(1);
	}
};

main();
