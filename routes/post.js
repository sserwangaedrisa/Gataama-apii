const express = require("express");
const postController = require("../controllers/post");
const reactionController = require("../controllers/reaction");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { isAdmin } = require("../middleware/role");
const upload = require("../middleware/image-upload");

/**
 * @openapi
 * /posts:
 *   get:
 *     tags:
 *       - Post
 *     summary: get all post
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: server error
 */
router.get("/", postController.getAllPosts);

/**
 * @openapi
 * /posts/{id}:
 *   get:
 *     tags:
 *       - Post
 *     summary: get post by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: post id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: server error
 */
router.get("/:id", postController.getPostById);

/**
 * @openapi
 * /posts/search:
 *   get:
 *     tags:
 *       - Post
 *     summary: search for post
 *     parameters:
 *       - name: title
 *         in: query
 *         required: true
 *         description: title
 *         schema:
 *           type: string
 *       - name: category
 *         in: query
 *         required: true
 *         description: category
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: server error
 */
router.get("/search", postController.search);

/**
 * @openapi
 * /posts/popular:
 *   get:
 *     tags:
 *       - Post
 *     summary: get all popular posts
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: server error
 */
router.get('/popular', postController.getPopularPosts);

/**
 * @openapi
 * /posts/published:
 *   get:
 *     tags:
 *       - Post
 *     summary: get all published post
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: server error
 */
router.get("/published", postController.getAllPublishedPosts);
/**
 * @openapi
 * /posts/{id}/reactions:
 *   get:
 *     tags:
 *       - Post
 *       - Reaction
 *     summary: get post reactions by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         description: post id
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: success
 *       500:
 *         description: server error
 */
// Route to get all reactions for a post
router.get('/:id/reactions', reactionController.getReactions);

/**
 * @openapi
 * /posts/:
 *   post:
 *     tags:
 *       - Post
 *     security:
 *       - bearerAuth: []
 *     summary: create post
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             $ref: '#/components/schemas/PostCreationInput'
 *     responses:
 *       201:
 *         description: successfull creation
 *       500:
 *         description: server error
 */
router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("image"),
  postController.createPost
);

router.put(
  "/publish/:id",
  verifyToken,
  isAdmin,
  postController.publishPost
);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  postController.updatePost
);
router.delete("/:id", verifyToken, isAdmin, postController.deletePost);

///reaction route
router.post('/:id/reactions', verifyToken, reactionController.addReaction);

router.delete('/:id/reactions', verifyToken, reactionController.removeReaction);


module.exports = router;
