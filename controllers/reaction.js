const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.addReaction = async (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const {  type } = req.body;
    const authorId = req.userId

    console.log(postId, authorId, type);
    
  
    try {
      const reaction = await prisma.reaction.create({
        data: {
          type,
          postId,
          authorId,
        }
      });
      res.json(reaction);
    } catch (error) {
      res.status(500).json({ error: error });
    }
  };
  
  // Remove a reaction from a post
  exports.removeReaction = async (req, res) => {
    const postId = parseInt(req.params.id, 10);
    const { authorId, type } = req.body;
  
    try {
      await prisma.reaction.deleteMany({
        where: {
          postId,
          authorId,
          type,
        }
      });
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Failed to remove reaction' });
    }
  };
  
  // Get all reactions for a post
  exports.getReactions = async (req, res) => {
    const postId = parseInt(req.params.id, 10);
  
    try {
      const reactions = await prisma.reaction.findMany({
        where: { postId }
      });
      res.json(reactions);
    } catch (error) {
      res.status(500).json({ error: 'Failed to retrieve reactions' });
    }
  };