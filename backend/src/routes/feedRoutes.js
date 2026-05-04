const express = require("express");
const feedController = require("../controllers/feedController");
const requireAuth = require("../middlewares/requireAuth");

const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Feed
 *   description: Social feed posts and interactions
 */

/**
 * @swagger
 * /feed:
 *   get:
 *     summary: Get home feed posts
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Number of posts per page
 *     responses:
 *       200:
 *         description: List of posts
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       401:
 *         description: Unauthorized
 */
router.get("/", requireAuth, feedController.getHomeFeed);
/**
 * @swagger
 * /feed:
 *   post:
 *     summary: Create a new post
 *     tags: [Feed]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - content
 *             properties:
 *               content:
 *                 type: string
 *               mediaUrl:
 *                 type: string
 *               mediaType:
 *                 type: string
 *                 enum: [image, video, none]
 *     responses:
 *       201:
 *         description: Post created successfully
 *       401:
 *         description: Unauthorized
 */
router.post("/", requireAuth, feedController.createPost);
router.get("/:postId", requireAuth, feedController.getPostById);
router.patch("/:postId", requireAuth, feedController.updatePost);
router.delete("/:postId", requireAuth, feedController.deletePost);
router.get("/:postId/comments", requireAuth, feedController.getComments);
router.post("/:postId/comments", requireAuth, feedController.addComment);
router.patch(
	"/:postId/comments/:commentId",
	requireAuth,
	feedController.updateComment,
);
router.delete(
	"/:postId/comments/:commentId",
	requireAuth,
	feedController.deleteComment,
);
router.post(
	"/:postId/comments/:commentId/likes",
	requireAuth,
	feedController.likeComment,
);
router.delete(
	"/:postId/comments/:commentId/likes",
	requireAuth,
	feedController.unlikeComment,
);
router.post("/:postId/likes", requireAuth, feedController.likePost);
router.delete("/:postId/likes", requireAuth, feedController.unlikePost);

module.exports = router;
