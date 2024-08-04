const express = require("express");
const postController = require("../controllers/post");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { isAdmin } = require("../middleware/role");
const upload = require("../middleware/image-upload");

router.post(
  "/",
  verifyToken,
  isAdmin,
  upload.single("image"),
  postController.createPost
);
router.get("/search", postController.search);
router.get("/", postController.getAllPosts);
router.get("/:id", postController.getPostById);
router.put(
  "/:id",
  verifyToken,
  isAdmin,
  upload.single("image"),
  postController.updatePost
);
router.delete("/:id", verifyToken, isAdmin, postController.deletePost);

module.exports = router;
