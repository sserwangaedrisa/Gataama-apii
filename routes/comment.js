const express = require("express");
const commentController = require("../controllers/comment");
const router = express.Router();
const verifyToken = require("../middleware/auth");

/**
 * @openapi
 * /comments:
 *   post:
 *     tags:
 *       - Comment
 *     security:
 *       - bearerAuth: []
 *     summary: create comment
 *     responseBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CommentInput'
 *     responses:
 *       201:
 *         description: comment created successfully
 *         content:
 *           application/json:
 *       400:
 *         description: error in comment creation
 *       403:
 *         description: error in input values
 *       404:
 *         description: unauthorized
 */
router.post("/", verifyToken, commentController.createComment);

/**
 * @openapi
 * /comments:
 *   get:
 *     tags:
 *       - Comment
 *     summary: get all comments
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: error
 */
router.get("/", commentController.getAllComments);

/**
 * @openapi
 * /comments/posts/{postId}:
 *   get:
 *     tags:
 *       - Comment
 *     summary: get comments by post id
 *     parameters:
 *       - name: postId
 *         in: path
 *         required: true
 *         description: post id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: error
 */
router.get("/posts/:postId", commentController.getCommentsByPostId); 

/**
 * @openapi
 * /comments/{id}:
 *   get:
 *     tags:
 *       - Comment
 *     summary: get comment by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: comment id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: error
 */
router.get("/:id", commentController.getCommentsByPostId); 

/**
 * @openapi
 * /comments/{id}:
 *   put:
 *     tags:
 *       - Comment
 *     summary: update comment by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: comment id
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *             required:
 *               - content           
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: error
 */
router.put("/:id", verifyToken, commentController.updateComment);

/**
 * @openapi
 * /comments/{id}:
 *   delete:
 *     tags:
 *       - Comment
 *     summary: detele comment by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: comment id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: error
 */
router.delete("/:id", verifyToken, commentController.deleteComment);

module.exports = router;
