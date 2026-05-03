const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const parseServiceAccount = (raw, sourceLabel) => {
	try {
		return JSON.parse(raw);
	} catch (error) {
		throw new Error(
			`Failed to parse Firebase service account from ${sourceLabel}: ${error.message}`,
		);
	}
};

const loadServiceAccountFromEnv = () => {
	const rawJson =
		process.env.FIREBASE_ADMIN_JSON || process.env.FIREBASE_SERVICE_ACCOUNT;
	if (rawJson) {
		return parseServiceAccount(rawJson, "FIREBASE_ADMIN_JSON");
	}

	const rawBase64 = process.env.FIREBASE_ADMIN_JSON_BASE64;
	if (rawBase64) {
		const decoded = Buffer.from(rawBase64, "base64").toString("utf8");
		return parseServiceAccount(decoded, "FIREBASE_ADMIN_JSON_BASE64");
	}

	return null;
};

const resolveServiceAccountPath = () => {
	const candidates = [
		path.resolve(__dirname, "../../firebase.json"),
		path.resolve(__dirname, "../../../firebase.json"),
	];

	if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
		candidates.unshift(
			path.resolve(process.env.GOOGLE_APPLICATION_CREDENTIALS),
		);
	}

	return candidates.find((candidate) => fs.existsSync(candidate)) || null;
};

const serviceAccountFromEnv = loadServiceAccountFromEnv();
const serviceAccountPath = serviceAccountFromEnv
	? null
	: resolveServiceAccountPath();

if (!serviceAccountFromEnv && !serviceAccountPath) {
	throw new Error(
		"Firebase service account is required. Provide FIREBASE_ADMIN_JSON, FIREBASE_ADMIN_JSON_BASE64, GOOGLE_APPLICATION_CREDENTIALS, or firebase.json in backend root.",
	);
}

const serviceAccount = serviceAccountFromEnv
	? serviceAccountFromEnv
	: parseServiceAccount(
			fs.readFileSync(serviceAccountPath, "utf8"),
			serviceAccountPath,
		);

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		projectId: serviceAccount.project_id,
	});
}

module.exports = admin;
