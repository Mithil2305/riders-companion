const { WebSocketServer, WebSocket } = require("ws");
const admin = require("../config/firebaseAdmin");
const { RiderAccount } = require("../models");
const chatHandler = require("./chatHandler");
const locationHandler = require("./locationHandler");

const WS_PATH = "/ws";
const HEARTBEAT_INTERVAL_MS = 30000;

const parseBearerToken = (value) => {
	if (typeof value !== "string") {
		return null;
	}

	const trimmed = value.trim();
	if (trimmed.startsWith("Bearer ")) {
		return trimmed.slice(7).trim() || null;
	}

	return trimmed || null;
};

const getTokenFromRequest = (req) => {
	try {
		const url = new URL(req.url || WS_PATH, "http://localhost");
		const queryToken =
			url.searchParams.get("token") || url.searchParams.get("access_token");
		if (queryToken) {
			return queryToken;
		}
	} catch (_error) {
		// Ignore malformed URL and fall back to headers.
	}

	const authHeader = req.headers.authorization;
	const authToken = parseBearerToken(authHeader);
	if (authToken) {
		return authToken;
	}

	const protocolHeader = req.headers["sec-websocket-protocol"];
	if (typeof protocolHeader === "string") {
		const parts = protocolHeader.split(",").map((entry) => entry.trim());
		for (const part of parts) {
			const token = parseBearerToken(part);
			if (token && token !== "Bearer") {
				return token;
			}
		}
	}

	return null;
};

const sendToSocket = (socket, type, payload = {}) => {
	if (!socket || socket.readyState !== WebSocket.OPEN) {
		return;
	}

	socket.send(
		JSON.stringify({
			type,
			payload,
			timestamp: new Date().toISOString(),
		}),
	);
};

const sendError = (socket, code, message, details = {}) => {
	sendToSocket(socket, "WS_ERROR", {
		code,
		message,
		...details,
	});
};

const addConnection = (state, riderId, socket) => {
	if (!state.connectionsByRider.has(riderId)) {
		state.connectionsByRider.set(riderId, new Set());
	}
	state.connectionsByRider.get(riderId).add(socket);
};

const removeConnection = (state, riderId, socket) => {
	const sockets = state.connectionsByRider.get(riderId);
	if (!sockets) {
		return;
	}

	sockets.delete(socket);
	if (sockets.size === 0) {
		state.connectionsByRider.delete(riderId);
	}
};

const authenticateSocket = async (req) => {
	const token = getTokenFromRequest(req);
	if (!token) {
		return null;
	}

	const decoded = await admin.auth().verifyIdToken(token);
	const rider = await RiderAccount.findOne({
		where: { firebase_uid: decoded.uid },
		attributes: ["id", "name", "username", "email", "firebase_uid"],
	});

	if (!rider) {
		return null;
	}

	return {
		id: rider.id,
		name: rider.name,
		username: rider.username,
		email: rider.email,
	};
};

const routeMessage = async ({ socket, state, message }) => {
	const { type, payload } = message;

	if (type === "PING") {
		sendToSocket(socket, "PONG", { riderId: socket.rider.id });
		return;
	}

	const locationHandled = await locationHandler.handleMessage({
		ws: socket,
		type,
		payload,
		state,
		sendToSocket,
		sendError,
	});

	if (locationHandled) {
		return;
	}

	const chatHandled = await chatHandler.handleMessage({
		ws: socket,
		type,
		payload,
		state,
		sendToSocket,
		sendError,
	});

	if (chatHandled) {
		return;
	}

	sendError(socket, "WS_UNKNOWN_EVENT", "Unsupported event type", {
		type,
	});
};

module.exports = (server) => {
	const wss = new WebSocketServer({
		server,
		path: WS_PATH,
	});

	const state = {
		connectionsByRider: new Map(),
		rideRooms: new Map(),
		chatRooms: new Map(),
		latestRideLocations: new Map(),
	};

	const heartbeat = setInterval(() => {
		for (const socket of wss.clients) {
			if (socket.isAlive === false) {
				socket.terminate();
				continue;
			}

			socket.isAlive = false;
			socket.ping();
		}
	}, HEARTBEAT_INTERVAL_MS);

	wss.on("close", () => {
		clearInterval(heartbeat);
	});

	wss.on("connection", (socket, req) => {
		socket.isAlive = true;
		socket.rideRooms = new Set();
		socket.chatRooms = new Set();

		socket.on("pong", () => {
			socket.isAlive = true;
		});

		void (async () => {
			try {
				const rider = await authenticateSocket(req);
				if (!rider) {
					sendError(socket, "WS_UNAUTHORIZED", "Authentication failed");
					socket.close(4401, "Unauthorized");
					return;
				}

				socket.rider = rider;
				addConnection(state, rider.id, socket);

				sendToSocket(socket, "WS_CONNECTED", {
					rider,
					path: WS_PATH,
				});
			} catch (error) {
				console.error("WebSocket authentication error", error);
				sendError(socket, "WS_UNAUTHORIZED", "Authentication failed");
				socket.close(4401, "Unauthorized");
			}
		})();

		socket.on("message", (rawMessage) => {
			void (async () => {
				if (!socket.rider) {
					sendError(socket, "WS_UNAUTHORIZED", "Authentication required");
					return;
				}

				let message;
				try {
					message = JSON.parse(rawMessage.toString());
				} catch (_error) {
					sendError(socket, "WS_BAD_JSON", "Message must be valid JSON");
					return;
				}

				if (!message || typeof message.type !== "string") {
					sendError(socket, "WS_BAD_EVENT", "Message type is required");
					return;
				}

				try {
					await routeMessage({
						socket,
						state,
						message,
					});
				} catch (error) {
					console.error("WebSocket message handling error", error);
					sendError(socket, "WS_SERVER_ERROR", "Failed to process event", {
						type: message.type,
					});
				}
			})();
		});

		socket.on("close", () => {
			if (socket.rider) {
				removeConnection(state, socket.rider.id, socket);
			}

			locationHandler.handleDisconnect({
				ws: socket,
				state,
				sendToSocket,
			});

			chatHandler.handleDisconnect({
				ws: socket,
				state,
				sendToSocket,
			});
		});

		socket.on("error", (error) => {
			console.error("WebSocket connection error", error);
		});
	});

	return wss;
};
