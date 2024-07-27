const express = require("express");
const postController = require("../controllers/postController");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { isAdmin } = require("../middleware/role");

router.post("/", verifyToken, isAdmin, postController.createPost);
router.get("/search", postController.search);
router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.put("/:id", verifyToken, isAdmin, postController.updatePost);
router.delete("/:id", verifyToken, isAdmin, postController.deletePost);

module.exports = router;
