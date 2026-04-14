require("dotenv").config();
const http = require("http");
const express = require("express");
const { sequelize } = require("./src/models");
const apiRoutes = require("./src/routes");
const setupWebSockets = require("./src/websockets/wss");

const app = express();
const server = http.createServer(app);
const port = process.env.PORT || 3000;

app.use(express.json());
app.use("/api", apiRoutes);

app.get("/health", async (_req, res) => {
	try {
		await sequelize.authenticate();
		return res.status(200).json({ ok: true, database: "connected" });
	} catch (_error) {
		return res.status(500).json({ ok: false, database: "disconnected" });
	}
});

setupWebSockets(server);

server.listen(port, () => {
	console.log(`Backend running on port ${port}`);
});
