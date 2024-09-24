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

    if (user.role === "admin") {
      next();
    } else {
      return res.status(403).send({ message: "Require Admin Role!" });
    }
  } catch (error) {
    res.status(500).send({ message: error.message });
  }
};

const isCountryAdmin = async (req, res, next) => {
  const { countryId } = req.params;
  console.log("Country ID:", countryId);

  // Ensure countryId is a valid number
  const parsedCountryId = parseInt(countryId, 10);
  if (isNaN(parsedCountryId)) {
    return res.status(400).json({ error: "Invalid country ID" });
  }

  try {
    const country = await prisma.country.findUnique({
      where: { id: parsedCountryId }, // Ensure parsedCountryId is passed correctly
      include: { admins: true },
    });

    if (!country) {
      return res.status(404).json({ error: "Country not found" });
    }

    // Ensure 'admins' field is an array and check if the user is an admin
    if (Array.isArray(country.admins) && req.userId) {
      const isAdmin = country.admins.some((admin) => admin.id === req.userId);
      if (!isAdmin) {
        return res.status(403).json({ error: "Access denied" });
      }

      console.log("User is an admin");
      next();
    } else {
      return res.status(500).json({ error: "Internal server error" });
    }
  } catch (err) {
    console.error("Error in isCountryAdmin middleware:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { isAdmin, isCountryAdmin };
