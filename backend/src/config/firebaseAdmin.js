const fs = require("fs");
const path = require("path");
const admin = require("firebase-admin");

const serviceAccountPath = path.resolve(__dirname, "../../firebase.json");

if (!fs.existsSync(serviceAccountPath)) {
	throw new Error("firebase.json is required at backend root");
}

const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, "utf8"));

if (!admin.apps.length) {
	admin.initializeApp({
		credential: admin.credential.cert(serviceAccount),
		projectId: serviceAccount.project_id,
	});
}

module.exports = admin;
