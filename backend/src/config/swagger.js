const swaggerJsdoc = require("swagger-jsdoc");

const options = {
	definition: {
		openapi: "3.0.0",
		info: {
			title: "Riders Companion API",
			version: "1.0.0",
			description: "API documentation for Riders Companion - A social platform for motorcycle riders",
			contact: {
				name: "API Support",
				email: "support@riderscompanion.com",
			},
		},
		servers: [
			{
				url: process.env.API_URL || "http://localhost:3000/api",
				description: "Development server",
			},
		],
		components: {
			securitySchemes: {
				bearerAuth: {
					type: "http",
					scheme: "bearer",
					bearerFormat: "JWT",
					description: "Firebase ID Token",
				},
			},
			schemas: {
				Error: {
					type: "object",
					properties: {
						success: { type: "boolean", example: false },
						message: { type: "string" },
						error: { type: "string" },
					},
				},
				User: {
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						name: { type: "string" },
						username: { type: "string" },
						email: { type: "string", format: "email" },
						avatarUrl: { type: "string", format: "uri" },
						bio: { type: "string" },
						location: { type: "string" },
						bikeDetails: { type: "string" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Ride: {
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						title: { type: "string" },
						description: { type: "string" },
						startLocation: { type: "string" },
						endLocation: { type: "string" },
						startTime: { type: "string", format: "date-time" },
						endTime: { type: "string", format: "date-time" },
						status: { type: "string", enum: ["planned", "ongoing", "completed", "cancelled"] },
						privacy: { type: "string", enum: ["public", "friends", "private"] },
						maxParticipants: { type: "integer" },
						createdBy: { type: "string", format: "uuid" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Post: {
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						content: { type: "string" },
						mediaUrl: { type: "string", format: "uri" },
						mediaType: { type: "string", enum: ["image", "video", "none"] },
						authorId: { type: "string", format: "uuid" },
						likesCount: { type: "integer" },
						commentsCount: { type: "integer" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Comment: {
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						content: { type: "string" },
						postId: { type: "string", format: "uuid" },
						authorId: { type: "string", format: "uuid" },
						likesCount: { type: "integer" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
				Notification: {
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						type: { type: "string" },
						message: { type: "string" },
						data: { type: "object" },
						isRead: { type: "boolean" },
						createdAt: { type: "string", format: "date-time" },
					},
				},
				ChatMessage: {
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						content: { type: "string" },
						senderId: { type: "string", format: "uuid" },
						chatId: { type: "string", format: "uuid" },
						messageType: { type: "string", enum: ["text", "image", "video", "location"] },
						createdAt: { type: "string", format: "date-time" },
					},
				},
				Story: {
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						mediaUrl: { type: "string", format: "uri" },
						mediaType: { type: "string", enum: ["image", "video"] },
						authorId: { type: "string", format: "uuid" },
						expiresAt: { type: "string", format: "date-time" },
						createdAt: { type: "string", format: "date-time" },
					},
				},
				Clip: {
					type: "object",
					properties: {
						id: { type: "string", format: "uuid" },
						title: { type: "string" },
						description: { type: "string" },
						videoUrl: { type: "string", format: "uri" },
						thumbnailUrl: { type: "string", format: "uri" },
						authorId: { type: "string", format: "uuid" },
						likesCount: { type: "integer" },
						createdAt: { type: "string", format: "date-time" },
						updatedAt: { type: "string", format: "date-time" },
					},
				},
			},
		},
		security: [
			{
				bearerAuth: [],
			},
		],
	},
	apis: ["./src/routes/*.js", "./src/models/*.js"],
};

const specs = swaggerJsdoc(options);

module.exports = specs;
