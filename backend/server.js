require("dotenv").config();
const http = require("http");
const express = require("express");
const { sequelize } = require("./src/models");
const apiRoutes = require("./src/routes");
const setupWebSockets = require("./src/websockets/wss");
const { assertCryptoReady } = require("./src/services/chatCryptoService");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;
const requestBodyLimit = process.env.REQUEST_BODY_LIMIT || "150mb";

app.use(express.json({ limit: requestBodyLimit }));
app.use(express.urlencoded({ extended: true, limit: requestBodyLimit }));
app.use("/api", apiRoutes);

app.use((error, _req, res, next) => {
	if (error?.type === "entity.too.large") {
		return res.status(413).json({
			success: false,
			message:
				"Upload payload is too large. Please choose shorter media or compress it before uploading.",
		});
	}

	if (error instanceof SyntaxError && "body" in error) {
		return res.status(400).json({
			success: false,
			message: "Invalid JSON payload.",
		});
	}

	return next(error);
});

try {
	assertCryptoReady();
} catch (error) {
	console.error(
		"Chat encryption is not configured. Set CHAT_AUTH_ID (or AUTH_ID) in environment.",
		error instanceof Error ? error.message : error,
	);
	process.exit(1);
}

app.get("/health", async (_req, res) => {
	try {
		await sequelize.authenticate();
		return res.status(200).json({ ok: true, database: "connected" });
	} catch (_error) {
		return res.status(500).json({ ok: false, database: "disconnected" });
	}
});

setupWebSockets(server);

server.listen(port,"0.0.0.0", () => {
	console.log(`Backend running on port ${port}`);
});
