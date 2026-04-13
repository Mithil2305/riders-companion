Rider App: Backend Implementation Guide

This document serves as the comprehensive technical guide for building the Node.js backend for the Rider Community & Safety Platform, strictly adhering to the provided Project Development Plan.

1. Tech Stack & Environment Setup

Core Stack:

Runtime: Node.js

Framework: Express.js (chosen over Hapi for broader ecosystem support)

Database: PostgreSQL with Sequelize ORM

Storage: Cloudflare R2 (using AWS S3 SDK)

Real-time: ws or socket.io (WebSockets)

Authentication: Firebase Admin SDK

Environment Variables (.env.dev / .env.prod)

PORT=3000
NODE_ENV=development
DATABASE_URL=postgres://user:password@localhost:5432/rider_db
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key"
CLOUDFLARE_R2_ACCOUNT_ID=your_account_id
CLOUDFLARE_R2_ACCESS_KEY=your_access_key
CLOUDFLARE_R2_SECRET_KEY=your_secret_key
CLOUDFLARE_R2_BUCKET_NAME=rider-media
CLOUDFLARE_R2_PUBLIC_URL=https://pub-your-public-id.r2.dev

2. Directory Structure Implementation

Based on the architectural plan, establish the following folder structure to maintain the Routes -> Controllers -> Services -> DAOs pattern.

/backend
├── src/
│ ├── config/ # DB, R2, Firebase configurations
│ ├── controllers/ # Route handlers mapping requests to services
│ ├── daos/ # Data Access Objects (DB Abstraction)
│ ├── middlewares/ # Auth and validation interceptors
│ ├── models/ # Sequelize schema definitions
│ ├── routes/ # Express route definitions
│ ├── services/ # Core business logic
│ ├── utils/ # Error formatting, loggers
│ └── websockets/ # Live ride & chat WS servers
├── .env.dev
├── package.json
└── server.js

3. Database Schema & Models (Sequelize)

The app relies on a strict relational schema using UUIDs. Here is the implementation of the core Sequelize models.

src/models/RiderAccount.js

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RiderAccount = sequelize.define('RiderAccount', {
id: {
type: DataTypes.UUID,
defaultValue: DataTypes.UUIDV4,
primaryKey: true,
},
firebase_uid: { type: DataTypes.STRING(128), unique: true, allowNull: false },
email: { type: DataTypes.STRING(255), unique: true, allowNull: false },
username: { type: DataTypes.STRING(50), unique: true, allowNull: false },
name: { type: DataTypes.STRING(100), allowNull: false },
bio: { type: DataTypes.TEXT, allowNull: true },
profile_image_url: { type: DataTypes.STRING(255), allowNull: true },
banner_image_url: { type: DataTypes.STRING(255), allowNull: true },
total_miles: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
}, {
tableName: 'rider_account',
timestamps: true, // Auto manages created_at and updated_at
});

module.exports = RiderAccount;

src/models/UserEncryptedChat.js (E2EE Implementation)

Backend has zero knowledge of message contents.

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const UserEncryptedChat = sequelize.define('UserEncryptedChat', {
id: {
type: DataTypes.UUID,
defaultValue: DataTypes.UUIDV4,
primaryKey: true,
},
sender_id: { type: DataTypes.UUID, allowNull: false },
receiver_id: { type: DataTypes.UUID, allowNull: true }, // For DMs
room_id: { type: DataTypes.UUID, allowNull: true }, // For Groups
encrypted_payload: { type: DataTypes.TEXT, allowNull: false }, // AES-GCM string
iv: { type: DataTypes.STRING(255), allowNull: false }, // Initialization Vector
}, {
tableName: 'user_encrypted_chats',
timestamps: true,
updatedAt: false, // Only need created_at
});

module.exports = UserEncryptedChat;

src/models/RideParticipant.js (Live Ride Tracking)

const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RideParticipant = sequelize.define('RideParticipant', {
id: { type: DataTypes.UUID, defaultValue: DataTypes.UUIDV4, primaryKey: true },
ride_id: { type: DataTypes.UUID, allowNull: false },
rider_id: { type: DataTypes.UUID, allowNull: false },
status: {
type: DataTypes.ENUM('IN_ZONE', 'OUT_OF_ZONE', 'SOS'),
defaultValue: 'IN_ZONE'
},
distance: { type: DataTypes.DECIMAL(10, 2), defaultValue: 0.00 },
}, {
tableName: 'ride_participant',
});

module.exports = RideParticipant;

(Note: Create similar models for UserBike, FeedPost, Community, Ride, and RideReport mapping exactly to the provided SQL schemas).

4. Middleware & Standardized Errors

Standardized Error Response (src/utils/errorFormatter.js)

Per guidelines, the backend must never fail silently and must always return a standard JSON structure.

exports.formatError = (res, statusCode, message, errorCode) => {
return res.status(statusCode).json({
success: false,
message: message,
code: errorCode || 'INTERNAL_ERROR'
});
};

Authentication Middleware (src/middlewares/requireAuth.js)

Validates the JWT sent from the client using Firebase Admin.

const admin = require('../config/firebase');
const { formatError } = require('../utils/errorFormatter');
const { RiderAccount } = require('../models');

module.exports = async (req, res, next) => {
const token = req.headers.authorization?.split('Bearer ')[1];

if (!token) {
return formatError(res, 401, 'No token provided', 'AUTH_MISSING_TOKEN');
}

try {
const decodedToken = await admin.auth().verifyIdToken(token);
// Find the user in our PostgreSQL DB mapped to this Firebase UID
const user = await RiderAccount.findOne({ where: { firebase_uid: decodedToken.uid } });

    if (!user) {
      return formatError(res, 404, 'User profile not found in database', 'AUTH_USER_NOT_FOUND');
    }

    req.user = user; // Attach DB user object to request
    next();

} catch (error) {
return formatError(res, 401, 'Invalid or expired token', 'AUTH_INVALID_TOKEN');
}
};

Body Validation Middleware (src/middlewares/validateBody.js)

Using Joi or Zod to ensure payloads are strictly typed.

const { formatError } = require('../utils/errorFormatter');

module.exports = (schema) => {
return (req, res, next) => {
const { error } = schema.validate(req.body);
if (error) {
return formatError(res, 400, error.details[0].message, 'VALIDATION_ERROR');
}
next();
};
};

5. Core Services (Business Logic)

Cloudflare R2 Upload Service (src/services/storageService.js)

const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
const crypto = require('crypto');

const s3Client = new S3Client({
region: 'auto',
endpoint: `https://${process.env.CLOUDFLARE_R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
credentials: {
accessKeyId: process.env.CLOUDFLARE_R2_ACCESS_KEY,
secretAccessKey: process.env.CLOUDFLARE_R2_SECRET_KEY,
},
});

exports.uploadMedia = async (fileBuffer, mimetype, folder = 'general') => {
const fileName = `${folder}/${crypto.randomUUID()}`;

const command = new PutObjectCommand({
Bucket: process.env.CLOUDFLARE_R2_BUCKET_NAME,
Key: fileName,
Body: fileBuffer,
ContentType: mimetype,
});

await s3Client.send(command);
return `https://pub-your-cloudflare-domain.r2.dev/${fileName}`;
};

Telemetry & Geofence Service (src/services/telemetryService.js)

Used to calculate ride statistics and bounds.

// Ray-casting algorithm to check if point is inside a GeoJSON polygon
exports.geoFenceCheck = (lat, lon, polygon) => {
let isInside = false;
for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
const xi = polygon[i][0], yi = polygon[i][1];
const xj = polygon[j][0], yj = polygon[j][1];

        const intersect = ((yi > lat) != (yj > lat))
            && (lon < (xj - xi) * (lat - yi) / (yj - yi) + xi);
        if (intersect) isInside = !isInside;
    }
    return isInside;

};

exports.generateRideReport = async (rideId) => {
// 1. Fetch all telemetry points for the ride
// 2. Calculate average speed, top speed, and total distance
// 3. Issue achievements/badges
// 4. Save to ride_report table
};

6. Real-Time WebSocket Engine

The core of the live coordination features. Setup a standard WebSocket server attached to the HTTP server.

WebSocket Server initialization (src/websockets/wss.js)

const WebSocket = require('ws');
const locationHandler = require('./locationHandler');
const chatHandler = require('./chatHandler');

module.exports = (server) => {
const wss = new WebSocket.Server({ server });

// Map to store active connections by Room/Community ID
const activeRooms = new Map();

wss.on('connection', (ws, req) => {
// Authenticate WS connection using query params or headers
// Extract riderId and roomId
ws.on('message', (message) => {
try {
const data = JSON.parse(message);

        switch(data.type) {
          case 'LOCATION_UPDATE':
            locationHandler.broadcast(activeRooms, data);
            break;
          case 'CHAT_MESSAGE':
            // Relay E2E encrypted payload ONLY
            chatHandler.relayMessage(activeRooms, data);
            break;
          case 'SOS_ALERT':
            locationHandler.broadcastSOS(activeRooms, data);
            break;
        }
      } catch (err) {
        console.error("WS Parsing Error", err);
      }
    });

    ws.on('close', () => {
      // Remove rider from activeRooms map
    });

});
};

Chat Handler (src/websockets/chatHandler.js)

Crucial Security Guideline: Never log plain text. Relay encrypted payloads directly.

const { UserEncryptedChat } = require('../models');

exports.relayMessage = async (activeRooms, data) => {
const { roomId, senderId, encryptedPayload, iv } = data;

// 1. Save strictly encrypted data to PostgreSQL
const savedMessage = await UserEncryptedChat.create({
room_id: roomId,
sender_id: senderId,
encrypted_payload: encryptedPayload,
iv: iv
});

// 2. Broadcast exactly what was received to other users in the room
const roomClients = activeRooms.get(roomId) || [];
roomClients.forEach(client => {
if (client.riderId !== senderId && client.ws.readyState === WebSocket.OPEN) {
client.ws.send(JSON.stringify({
type: 'NEW_CHAT_MESSAGE',
payload: {
id: savedMessage.id,
senderId,
encryptedPayload,
iv,
timestamp: savedMessage.created_at
}
}));
}
});
};

7. Controllers and Routing Example

src/controllers/feedController.js

const feedService = require('../services/feedService');
const { formatError } = require('../utils/errorFormatter');

exports.createPost = async (req, res) => {
try {
const riderId = req.user.id;
const { caption, mediaUrl, mediaType } = req.body;

    const newPost = await feedService.createPost({
      riderId, caption, mediaUrl, mediaType
    });

    res.status(201).json({ success: true, data: newPost });

} catch (error) {
formatError(res, 500, 'Failed to create post', 'FEED_CREATE_ERR');
}
};

src/routes/feedRoutes.js

const express = require('express');
const router = express.Router();
const feedController = require('../controllers/feedController');
const requireAuth = require('../middlewares/requireAuth');
const validateBody = require('../middlewares/validateBody');
const { postSchema } = require('../utils/validationSchemas'); // Assume Joi schemas are defined here

// Map routes to controllers, applying Auth and Body Validation middleware
router.post('/', requireAuth, validateBody(postSchema), feedController.createPost);
router.get('/', requireAuth, feedController.getHomeFeed);

module.exports = router;

8. Application Entry Point (server.js)

require('dotenv').config();
const express = require('express');
const http = require('http');
const sequelize = require('./src/config/database');
const setupWebSockets = require('./src/websockets/wss');

// Route Imports
const authRoutes = require('./src/routes/authRoutes');
const feedRoutes = require('./src/routes/feedRoutes');
const rideRoutes = require('./src/routes/rideRoutes');

const app = express();
const server = http.createServer(app);

// Global Middleware
app.use(express.json()); // Parse JSON bodies

// Mount Routes
app.use('/api/auth', authRoutes);
app.use('/api/feed', feedRoutes);
app.use('/api/rides', rideRoutes);

// Setup WebSockets
setupWebSockets(server);

// Start Server
const PORT = process.env.PORT || 3000;

const startServer = async () => {
try {
// Database connection test & sync
await sequelize.authenticate();
console.log('Database connected successfully.');

    // Note: Do NOT use { force: true } or { alter: true } in production. Use migrations.
    if (process.env.NODE_ENV === 'development') {
       await sequelize.sync();
    }

    server.listen(PORT, () => {
      console.log(`Rider backend running on port ${PORT}`);
    });

} catch (error) {
console.error('Unable to start server:', error);
}
};

startServer();
