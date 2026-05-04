const express = require("express");
const authController = require("../controllers/authController");
const requireAuth = require("../middlewares/requireAuth");
const validateBody = require("../middlewares/validateBody");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Authentication
 *   description: User authentication and profile management
 */

const loginSchema = (body) => {
	if (!body || typeof body.idToken !== "string" || !body.idToken.trim()) {
		return { error: "idToken is required" };
	}

	return { error: null };
};

const signupSchema = (body) => {
	if (!body || typeof body.idToken !== "string" || !body.idToken.trim()) {
		return { error: "idToken is required" };
	}

	if (typeof body.name !== "string" || !body.name.trim()) {
		return { error: "name is required" };
	}

	if (typeof body.username !== "string" || !body.username.trim()) {
		return { error: "username is required" };
	}

	return { error: null };
};

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Login with Firebase ID token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 token:
 *                   type: string
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
router.post("/login", validateBody(loginSchema), authController.login);
/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idToken
 *               - name
 *               - username
 *             properties:
 *               idToken:
 *                 type: string
 *                 description: Firebase ID token
 *               name:
 *                 type: string
 *                 description: User's full name
 *               username:
 *                 type: string
 *                 description: Unique username
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Invalid request
 *       409:
 *         description: Username already exists
 */
router.post("/signup", validateBody(signupSchema), authController.signup);
/**
 * @swagger
 * /auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       401:
 *         description: Unauthorized
 */
router.get("/me", requireAuth, authController.getProfile);

module.exports = router;
