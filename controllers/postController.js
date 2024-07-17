const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createPost = async (req, res) => {
  try {
    const { title, content, published, authorId, categoryIds } = req.body;
    const post = await prisma.post.create({
      data: {
        title,
        content,
        published,
        author: { connect: { id: authorId } },
        categories: { connect: categoryIds.map((id) => ({ id })) },
      },
    });
    res.json(post);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      include: {
        author: {
          select: {
            id: true,
            fullNames: true,
            email: true,
          },
        },
        categories: true,
        comments: {
          include: {
            author: {
              select: {
                id: true,
                fullNames: true,
                email: true,
              },
            },
            replies: {
              // Include replies to comments
              include: {
                author: {
                  select: {
                    id: true,
                    fullNames: true,
                    email: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    res.json(posts);
  } catch (error) {
    res.status(500).send({ message: error.message });
  } finally {
    await prisma.$disconnect(); // Disconnect Prisma client
  }
};

exports.getPostById = async (req, res) => {
  try {
    const { id } = req.params;
    const post = await prisma.post.findUnique({
      where: { id: parseInt(id, 10) },
      include: {
        author: true,
        categories: true,
        comments: {
          include: { author: true },
        },
      },
    });
    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }
    res.json(post);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, published, categoryIds } = req.body;
    const post = await prisma.post.update({
      where: { id: parseInt(id, 10) },
      data: {
        title,
        content,
        published,
        categories: {
          set: categoryIds.map((id) => ({ id })),
        },
      },
    });
    res.json(post);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.deletePost = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.post.delete({
      where: { id: parseInt(id, 10) },
    });
    res.send({ message: "Post deleted successfully" });
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

[
  {
    id: 1,
    title: "My First Post",
    content: "This is the content of my first post.",
    published: true,
    createdAt: "2024-07-14T07:32:50.168Z",
    updatedAt: "2024-07-14T07:32:50.168Z",
    authorId: 1,
    author: {
      id: 1,
      fullNames: "admin",
      email: "admin@gmail.com",
    },
    categories: [
      {
        id: 1,
        name: "Technology",
      },
    ],
    comments: [
      {
        id: 1,
        content: "This is a comment.",
        createdAt: "2024-07-14T07:37:43.024Z",
        postId: 1,
        authorId: 1,
        parentId: null,
        author: {
          id: 1,
          fullNames: "admin",
          email: "admin@gmail.com",
        },
        replies: [
          {
            id: 3,
            content: "This is a reply to the top-level comment",
            createdAt: "2024-07-14T07:49:32.116Z",
            postId: 1,
            authorId: 1,
            parentId: 1,
            author: {
              id: 1,
              fullNames: "admin",
              email: "admin@gmail.com",
            },
          },
          {
            id: 4,
            content: "Tvel comment",
            createdAt: "2024-07-14T07:51:55.194Z",
            postId: 1,
            authorId: 1,
            parentId: 1,
            author: {
              id: 1,
              fullNames: "admin",
              email: "admin@gmail.com",
            },
          },
        ],
      },
      {
        id: 2,
        content: "This is another comment tho.",
        createdAt: "2024-07-14T07:48:24.531Z",
        postId: 1,
        authorId: 1,
        parentId: null,
        author: {
          id: 1,
          fullNames: "admin",
          email: "admin@gmail.com",
        },
        replies: [],
      },
      {
        id: 3,
        content: "This is a reply to the top-level comment",
        createdAt: "2024-07-14T07:49:32.116Z",
        postId: 1,
        authorId: 1,
        parentId: 1,
        author: {
          id: 1,
          fullNames: "admin",
          email: "admin@gmail.com",
        },
        replies: [],
      },
      {
        id: 4,
        content: "Tvel comment",
        createdAt: "2024-07-14T07:51:55.194Z",
        postId: 1,
        authorId: 1,
        parentId: 1,
        author: {
          id: 1,
          fullNames: "admin",
          email: "admin@gmail.com",
        },
        replies: [],
      },
    ],
  },
];
