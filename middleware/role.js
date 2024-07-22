const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const isAdmin = async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.userId },
    });

    if (!user) {
      return res.status(404).send({ message: "User not found." });
    }

    if (user.role === "admin" || user.role === "countryAdmin") {
      next();
    } else {
      return res.status(403).send({ message: "Require Admin Role!" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};
module.exports = { isAdmin };
