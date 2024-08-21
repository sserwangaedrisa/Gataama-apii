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
  console.log(countryId);
  console.log("Country ID:", countryId);

  try {
    const country = await prisma.country.findUnique({
      where: { id: parseInt(countryId) },
      include: { admins: true }, // Ensure 'admins' is the correct field
    });

    // Log the country object to inspect its structure
    console.log("Country Object:", country);

    if (!country) {
      return res.status(404).json({ error: "Country not found" });
    }

    // Check if admins is an array and if req.user is defined
    if (!Array.isArray(country.admins)) {
      console.error("Admins field is not an array:", country.admins);
      return res.status(500).json({ error: "Internal server error" });
    }

    if (!req.userId || typeof req.userId === "undefined") {
      console.error("req.user or req.user.id is undefined:", req.user);
      return res.status(500).json({ error: "Internal server error" });
    }

    // Check if the requesting user is one of the country admins
    const isAdmin = country.admins.some((admin) => admin.id === req.userId);

    if (!isAdmin) {
      return res.status(403).json({ error: "Access denied" });
    }

    console.log("User is an admin");
    next();
  } catch (err) {
    console.error("Error in isCountryAdmin middleware:", err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { isAdmin, isCountryAdmin };
