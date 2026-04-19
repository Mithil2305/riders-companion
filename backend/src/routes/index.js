const express = require("express");

const authRoutes = require("./authRoutes");
const feedRoutes = require("./feedRoutes");
const rideRoutes = require("./rideRoutes");
const communityRoutes = require("./communityRoutes");
const chatRoutes = require("./chatRoutes");
const clipRoutes = require("./clipRoutes");
const storyRoutes = require("./storyRoutes");
const trackerRoutes = require("./trackerRoutes");
const notificationRoutes = require("./notificationRoutes");
const profileRoutes = require("./profileRoutes");

const router = express.Router();

router.use("/auth", authRoutes);
router.use("/feed", feedRoutes);
router.use("/rides", rideRoutes);
router.use("/community", communityRoutes);
router.use("/chat", chatRoutes);
router.use("/clips", clipRoutes);
router.use("/stories", storyRoutes);
router.use("/tracker", trackerRoutes);
router.use("/notifications", notificationRoutes);
router.use("/profile", profileRoutes);

module.exports = router;
