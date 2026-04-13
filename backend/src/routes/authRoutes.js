const express = require("express");
const authController = require("../controllers/authController");
const requireAuth = require("../middlewares/requireAuth");
const validateBody = require("../middlewares/validateBody");

const router = express.Router();

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

router.post("/login", validateBody(loginSchema), authController.login);
router.post("/signup", validateBody(signupSchema), authController.signup);
router.get("/me", requireAuth, authController.getProfile);

module.exports = router;
