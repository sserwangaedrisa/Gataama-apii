const express = require("express");
const commentController = require("../controllers/commentController");
const router = express.Router();
const verifyToken = require("../middleware/auth");

router.post("/", verifyToken, commentController.createComment);
router.get("/", commentController.getAllComments);
router.get("/:id", commentController.getCommentsByPostId);
router.get("/:postId", commentController.getCommentsByPostId);
router.put("/:id", verifyToken, commentController.updateComment);
router.delete("/:id", verifyToken, commentController.deleteComment);

module.exports = router;
