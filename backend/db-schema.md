# Rider Platform: Unified Backend Architecture & Database Schema

This document serves as the master technical guide for the Rider Community & Safety Platform. It outlines the architecture, directory structure, complete relational database schema, and core Node.js implementations based on the system's dual-purpose nature (social network + live ride coordination).

---

## 1. Tech Stack & Environment Setup

**Core Stack:**

- **Runtime:** Node.js
- **Framework:** Express.js
- **Database:** PostgreSQL with `Sequelize` ORM
- **Storage:** Cloudflare R2 (using AWS S3 SDK) / SeaweedFS / Local
- **Real-time:** `ws` (WebSockets) for live ride tracking
- **Authentication:** Firebase Admin SDK + JWT Session Tokens
- **Chat:** Sendbird SDK (with custom E2EE fallback/adjunct in DB)

**Environment Variables (`.env.dev` / `.env.prod`)**

```env
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
```

---

## 2. Complete Database Schema (PostgreSQL)

All tables use `UUID` for primary keys to ensure global uniqueness and prevent enumeration attacks.

### 2.1 Identity & Profile Data

**`rider_account`**
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default: `uuid_generate_v4()` | Unique user identifier |
| `firebase_uid` | VARCHAR(128) | UNIQUE, NOT NULL | Linked Firebase auth ID |
| `email` | VARCHAR(255) | UNIQUE, NOT NULL | User's email address |
| `username` | VARCHAR(50) | UNIQUE, NOT NULL | Public @handle |
| `name` | VARCHAR(100) | NOT NULL | Display name |
| `bio` | TEXT | NULL | Short user biography |
| `profile_image_url`| VARCHAR(255) | NULL | Storage URL |
| `banner_image_url` | VARCHAR(255) | NULL | Storage URL |
| `total_miles` | DECIMAL(10,2) | Default: 0.00 | Accumulated ride mileage |
| `created_at` | TIMESTAMPTZ | Default: NOW() | Account creation time |
| `updated_at` | TIMESTAMPTZ | Default: NOW() | Last profile update |

**`user_bike` (Garage)**
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default: `uuid_generate_v4()` | Unique bike identifier |
| `rider_id` | UUID | FK -> `rider_account.id` | Owner of the bike |
| `brand` | VARCHAR(100) | NOT NULL | e.g., Honda, Ducati |
| `model` | VARCHAR(100) | NOT NULL | e.g., CBR600RR |
| `year` | INTEGER | NOT NULL | Manufacture year |
| `bike_image_url` | VARCHAR(255) | NULL | Photo of the bike |
| `is_primary` | BOOLEAN | Default: FALSE | Default bike used for rides |

### 2.2 Social Layer Data

**`feed_post`**
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default: `uuid_generate_v4()` | Post ID |
| `rider_id` | UUID | FK -> `rider_account.id` | Author |
| `caption` | TEXT | NULL | Accompanying text |
| `media_url` | VARCHAR(255) | NULL | Image or video URL |
| `media_type` | VARCHAR(20) | NULL | IMAGE, VIDEO, or TEXT |
| `created_at` | TIMESTAMPTZ | Default: NOW() | Time posted |

**`clip` (Clips)**
| Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- |
| `id` | UUID | PK, Default: `uuid_generate_v4()` | Clip ID |
| `rider_id` | UUID | FK -> `rider_account.id` | Creator |
| `video_url` | VARCHAR(255) | NOT NULL | Video Storage URL |
| `song_id` | VARCHAR(100) | NULL | External music/audio reference |
| `created_at` | TIMESTAMPTZ | Default: NOW() | Time uploaded |

**`tracker` & `friends` (Connections)**
| Table | Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `tracker` | `id` | UUID | PK | Tracker mapping ID |
| | `follower_id` | UUID | FK -> `rider_account.id` | User following |
| | `following_id` | UUID | FK -> `rider_account.id` | User being followed |
| `friends` | `id` | UUID | PK | Mutual Friendship ID |
| | `user_id_1` | UUID | FK -> `rider_account.id` | Requester |
| | `user_id_2` | UUID | FK -> `rider_account.id` | Recipient |
| | `status` | VARCHAR(20)| Default: 'PENDING' | PENDING, ACCEPTED, BLOCKED |

### 2.3 Ride Coordination & Safety Data

**`community` & `community_member` (Rooms)**
| Table | Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `community` | `id` | UUID | PK | Room ID |
| | `creator_id`| UUID | FK -> `rider_account.id` | Captain / Owner |
| | `name` | VARCHAR(100)| NOT NULL | Room display name |
| | `password` | VARCHAR(255)| NULL | PIN for private rooms |
| `community_member`| `id` | UUID | PK | Membership ID |
| | `community_id`| UUID | FK -> `community.id` | Room reference |
| | `rider_id` | UUID | FK -> `rider_account.id` | User reference |
| | `role` | VARCHAR(20) | Default: 'MEMBER' | 'CAPTAIN' or 'MEMBER' |

**`ride` & `ride_participant` (Live Sessions)**
| Table | Column | Type | Constraints | Description |
| :--- | :--- | :--- | :--- | :--- |
| `ride` | `id` | UUID | PK | Ride session ID |
| | `community_id`| UUID | FK -> `community.id` | Room hosting the ride |
| | `status` | VARCHAR(20) | Default: 'PLANNING'| PLANNING, ACTIVE, COMPLETED |
| | `route_polygon`| JSONB | NULL | GeoJSON for zone tracking |
| `ride_participant`| `id` | UUID | PK | Session member ID |
| | `ride_id` | UUID | FK -> `ride.id` | Ride reference |
| | `rider_id` | UUID | FK -> `rider_account.id` | Rider reference |
| | `status` | VARCHAR(30) | Default: 'IN_ZONE' | IN_ZONE, OUT_OF_ZONE, SOS |

---

## 3. Directory Architecture

```text
/backend
├── src/
│   ├── config/          # DB, Storage, Firebase configurations
│   ├── controllers/     # Route handlers mapping requests to services
│   ├── daos/            # Data Access Objects (DB Abstraction)
│   ├── middlewares/     # Auth and validation interceptors
│   ├── models/          # Sequelize schema definitions
│   ├── routes/          # Express route definitions
│   ├── services/        # Core business logic (feedService, rideService, etc.)
│   ├── utils/           # Error formatting, loggers
│   └── websockets/      # Live ride & chat WS servers
├── .env.dev
├── package.json
└── server.js
```

---

## 4. Backend Implementations

### 4.1 Authentication Middleware (`src/middlewares/requireAuth.js`)

Validates the JWT sent from the client using Firebase Admin, linking to the internal DB.

```javascript
const admin = require("../config/firebase");
const { formatError } = require("../utils/errorFormatter");
const { RiderAccount } = require("../models");

module.exports = async (req, res, next) => {
	const token = req.headers.authorization?.split("Bearer ")[1];

	if (!token)
		return formatError(res, 401, "No token provided", "AUTH_MISSING_TOKEN");

	try {
		const decodedToken = await admin.auth().verifyIdToken(token);
		const user = await RiderAccount.findOne({
			where: { firebase_uid: decodedToken.uid },
		});

		if (!user)
			return formatError(
				res,
				404,
				"User profile not found",
				"AUTH_USER_NOT_FOUND",
			);

		req.user = user;
		next();
	} catch (error) {
		return formatError(
			res,
			401,
			"Invalid or expired token",
			"AUTH_INVALID_TOKEN",
		);
	}
};
```

### 4.2 Live Ride WebSocket Server (`src/websockets/wss.js`)

The core of the live coordination features. Relays location and SOS states.

```javascript
const WebSocket = require("ws");
const locationHandler = require("./locationHandler");

module.exports = (server) => {
	const wss = new WebSocket.Server({ server });
	const activeRooms = new Map(); // Maps roomId -> array of connected clients

	wss.on("connection", (ws, req) => {
		// Authentication & Identification logic here
		// Assumes ws is augmented with riderId and roomId

		ws.on("message", (message) => {
			try {
				const data = JSON.parse(message);

				switch (data.type) {
					case "LOCATION_UPDATE":
						locationHandler.broadcast(activeRooms, data);
						break;
					case "SOS_ALERT":
						locationHandler.broadcastSOS(activeRooms, data);
						break;
				}
			} catch (err) {
				console.error("WS Parsing Error", err);
			}
		});
	});
};
```

### 4.3 Ride Controller & Routing Example

**`src/controllers/rideController.js`**

```javascript
const rideService = require("../services/rideService");
const { formatError } = require("../utils/errorFormatter");

exports.createRide = async (req, res) => {
	try {
		const riderId = req.user.id;
		const { communityId, routePolygon } = req.body;

		const newRide = await rideService.createRide({
			communityId,
			routePolygon,
			creatorId: riderId,
		});

		res.status(201).json({ success: true, data: newRide });
	} catch (error) {
		formatError(res, 500, "Failed to create ride", "RIDE_CREATE_ERR");
	}
};
```

**`src/routes/rideRoutes.js`**

```javascript
const express = require("express");
const router = express.Router();
const rideController = require("../controllers/rideController");
const requireAuth = require("../middlewares/requireAuth");
const validateBody = require("../middlewares/validateBody");
const { rideSchema } = require("../utils/validationSchemas");

router.post(
	"/",
	requireAuth,
	validateBody(rideSchema),
	rideController.createRide,
);
router.post("/:id/join", requireAuth, rideController.joinRide);
router.post("/:id/end", requireAuth, rideController.endRide);

module.exports = router;
```

### 4.4 App Entry Point (`server.js`)

```javascript
require("dotenv").config();
const express = require("express");
const http = require("http");
const sequelize = require("./src/config/database");
const setupWebSockets = require("./src/websockets/wss");

const authRoutes = require("./src/routes/authRoutes");
const feedRoutes = require("./src/routes/feedRoutes");
const rideRoutes = require("./src/routes/rideRoutes");

const app = express();
const server = http.createServer(app);

app.use(express.json());

app.use("/api/auth", authRoutes);
app.use("/api/feed", feedRoutes);
app.use("/api/rides", rideRoutes);

setupWebSockets(server);

const PORT = process.env.PORT || 3000;

const startServer = async () => {
	try {
		await sequelize.authenticate();
		if (process.env.NODE_ENV === "development") {
			await sequelize.sync(); // Auto-sync in dev only
		}
		server.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
	} catch (error) {
		console.error("Startup Error:", error);
	}
};

startServer();
```
