const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createComment = async (req, res) => {
  try {
    const { content, postId, authorId, parentId } = req.body;

    const comment = await prisma.comment.create({
      data: {
        content,
        postId,
        authorId,
        parentId, // This can be null for top-level comments
      },
    });

    res.status(201).json(comment);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getCommentsByPostId = async (req, res) => {
  try {
    const { postId } = req.params;

    const comments = await prisma.comment.findMany({
      where: { postId, parentId: null }, // Top-level comments only
      include: {
        replies: true, // Include replies to the comments
      },
    });

    res.status(200).json(comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

exports.getAllComments = async (req, res) => {
  try {
    const comments = await prisma.comment.findMany({
      include: { author: true, post: true },
    });
    res.json(comments);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getCommentById = async (req, res) => {
  try {
    const { id } = req.params;
    const comment = await prisma.comment.findUnique({
      where: { id: parseInt(id, 10) },
      include: { author: true, post: true },
    });
    if (!comment) {
      return res.status(404).send({ message: "Comment not found" });
    }
    res.json(comment);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updateComment = async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;
    const comment = await prisma.comment.update({
      where: { id: parseInt(id, 10) },
      data: { content },
    });
    res.json(comment);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.comment.delete({
      where: { id: parseInt(id, 10) },
    });
    res.send({ message: "Comment deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
