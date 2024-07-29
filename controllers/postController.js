const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const upload = require("../middleware/image-upload");

exports.createPost = async (req, res) => {
  upload.single('image')(req, res, async (err) => {
    console.log("image is uploadng");
    if (err) {
	console.log(err);
      return res.status(400).send({ message: err.message });
    }
    try {
      const { title, content, published, categoryIds, isFeatured } = req.body;
      const imageUrl = req.file ? `/uploads/blog/${req.file.filename}` : null;
      const authorId = req.userId; // Extract userId from verified token

      console.log("Generated Image URL:", imageUrl);

      const post = await prisma.post.create({
        data: {
          title,
          content,
          published,
          imageUrl,
          isFeatured,
          author: { connect: { id: authorId } },
          categories: {
            connect: { id: categoryIds },
          },
        },
        include: {
          author: {
            select: {
              id: true,
              fullNames: true,
              email: true,
            },
          },
          categories: true,
        },
      });

      res.json(post);
    } catch (error) {
      console.error("Error creating post:", error);
      res.status(500).send({ message: "Error creating post", error : error });
    } finally {
      await prisma.$disconnect();
    }
  });
};

exports.search = async (req, res) => {
  const { title, category } = req.query;

  try {
    const posts = await prisma.post.findMany({
      where: {
        AND: [
          title
            ? {
                title: {
                  contains: title,
                  mode: "insensitive",
                },
              }
            : {},
          category
            ? {
                categories: {
                  some: {
                    name: {
                      equals: category,
                      mode: "insensitive",
                    },
                  },
                },
              }
            : {},
        ],
      },
      include: {
        categories: true,
        author: {
          select: {
            id: true,
            fullNames: true,
            email: true,
          },
        },
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
    console.error("Search and filter error:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

exports.getAllPosts = async (req, res) => {
  try {
    const posts = await prisma.post.findMany({
      where: {
        published: true, // Filter posts where published is true
      },
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
        author: {
          select: {
            id: true,
            fullNames: true,
            email: true,
          },
        },
        categories: true,
        comments: {
          where: { parentId: null }, // Fetch only top-level comments
          include: {
            author: {
              select: {
                id: true,
                fullNames: true,
                email: true,
              },
            },
            replies: {
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

    if (!post) {
      return res.status(404).send({ message: "Post not found" });
    }

    // Remove duplicate comments manually
    const uniqueComments = post.comments.filter((comment, index, self) => {
      // Filter out comments that have the same id as previous ones
      return index === self.findIndex((c) => c.id === comment.id);
    });

    // Replace comments with filtered uniqueComments
    post.comments = uniqueComments;

    res.json(post);
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

exports.updatePost = async (req, res) => {
  upload(req, res, async (err) => {
    if (err) {
      return res.status(400).send({ message: err });
    }

    const { id } = req.params;
    const { title, content, published, categoryIds, isFeatured } = req.body;
    const imageUrl = req.file ? `/uploads/${req.file.filename}` : null;
    const userId = req.userId;
    const userRole = req.userRole; // Assuming you set userRole in the verifyToken middleware

    try {
      // Check if user is super admin or country admin
      if (userRole === "admin") {
        // Super admin can update any post
        const post = await prisma.post.update({
          where: { id: parseInt(id, 10) },
          data: {
            title,
            content,
            published,
            imageUrl,
            isFeatured,
            categories: {
              connect: categoryIds.map((categoryId) => ({ id: categoryId })),
            },
          },
        });
        res.json(post);
      } else if (userRole === "countryAdmin") {
        // Country admin can update only their own posts
        const post = await prisma.post.findUnique({
          where: { id: parseInt(id, 10) },
        });

        if (!post) {
          return res.status(404).send({ message: "Post not found" });
        }

        // Check if the post belongs to the country admin
        if (post.authorId !== userId) {
          return res.status(403).send({
            message: "Unauthorized: You can only update your own posts",
          });
        }

        const updatedPost = await prisma.post.update({
          where: { id: parseInt(id, 10) },
          data: {
            title,
            content,
            published,
            imageUrl,
            categories: {
              connect: categoryIds.map((categoryId) => ({ id: categoryId })),
            },
          },
        });

        res.json(updatedPost);
      } else {
        // Unauthorized role
        return res
          .status(403)
          .send({ message: "Unauthorized: Insufficient privileges" });
      }
    } catch (error) {
      console.error("Error updating post:", error);
      res.status(500).send({ message: "Error updating post" });
    } finally {
      await prisma.$disconnect();
    }
  });
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

// [
//   {
//     id: 1,
//     title: "My First Post",
//     content: "This is the content of my first post.",
//     published: true,
//     createdAt: "2024-07-14T07:32:50.168Z",
//     updatedAt: "2024-07-14T07:32:50.168Z",
//     authorId: 1,
//     author: {
//       id: 1,
//       fullNames: "admin",
//       email: "admin@gmail.com",
//     },
//     categories: [
//       {
//         id: 1,
//         name: "Technology",
//       },
//     ],
//     comments: [
//       {
//         id: 1,
//         content: "This is a comment.",
//         createdAt: "2024-07-14T07:37:43.024Z",
//         postId: 1,
//         authorId: 1,
//         parentId: null,
//         author: {
//           id: 1,
//           fullNames: "admin",
//           email: "admin@gmail.com",
//         },
//         replies: [
//           {
//             id: 3,
//             content: "This is a reply to the top-level comment",
//             createdAt: "2024-07-14T07:49:32.116Z",
//             postId: 1,
//             authorId: 1,
//             parentId: 1,
//             author: {
//               id: 1,
//               fullNames: "admin",
//               email: "admin@gmail.com",
//             },
//           },
//           {
//             id: 4,
//             content: "Tvel comment",
//             createdAt: "2024-07-14T07:51:55.194Z",
//             postId: 1,
//             authorId: 1,
//             parentId: 1,
//             author: {
//               id: 1,
//               fullNames: "admin",
//               email: "admin@gmail.com",
//             },
//           },
//         ],
//       },
//       {
//         id: 2,
//         content: "This is another comment tho.",
//         createdAt: "2024-07-14T07:48:24.531Z",
//         postId: 1,
//         authorId: 1,
//         parentId: null,
//         author: {
//           id: 1,
//           fullNames: "admin",
//           email: "admin@gmail.com",
//         },
//         replies: [],
//       },
//       {
//         id: 3,
//         content: "This is a reply to the top-level comment",
//         createdAt: "2024-07-14T07:49:32.116Z",
//         postId: 1,
//         authorId: 1,
//         parentId: 1,
//         author: {
//           id: 1,
//           fullNames: "admin",
//           email: "admin@gmail.com",
//         },
//         replies: [],
//       },
//       {
//         id: 4,
//         content: "Tvel comment",
//         createdAt: "2024-07-14T07:51:55.194Z",
//         postId: 1,
//         authorId: 1,
//         parentId: 1,
//         author: {
//           id: 1,
//           fullNames: "admin",
//           email: "admin@gmail.com",
//         },
//         replies: [],
//       },
//     ],
//   },
// ];
