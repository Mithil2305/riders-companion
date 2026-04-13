const express = require("express");
const profileController = require("../controllers/profileController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

router.get("/me", requireAuth, profileController.getMyProfile);
router.patch("/me", requireAuth, profileController.updateMyProfile);
router.get("/garage", requireAuth, profileController.getGarageBikes);
router.post("/garage/bikes", requireAuth, profileController.addGarageBike);
router.patch(
	"/garage/bikes/:bikeId",
	requireAuth,
	profileController.updateGarageBike,
);
router.delete(
	"/garage/bikes/:bikeId",
	requireAuth,
	profileController.deleteGarageBike,
);

module.exports = router;
