const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

// Create a new country (Admin Only)
exports.createCountry = async (req, res) => {
  const { name, adminId } = req.body;
  try {
    // Check if the provided adminId is for a user with the "countryAdmin" role
    if (adminId) {
      const adminUser = await prisma.user.findUnique({
        where: { id: adminId },
        select: { role: true },
      });

      if (!adminUser || adminUser.role !== "countryAdmin") {
        return res
          .status(400)
          .json({ error: "The provided user is not a country admin" });
      }
    }

    // Create the country and assign the admin if provided
    const country = await prisma.country.create({
      data: {
        name,
        admins: adminId ? { connect: { id: adminId } } : undefined,
      },
    });

    res.status(201).json(country);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get all countries (Public)
exports.getAllCountries = async (req, res) => {
  try {
    const countries = await prisma.country.findMany({
      include: {
        departments: true,
        admins: true, // Include admins in the response
      },
    });
    res.json(countries);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get a single country by ID (Public)
exports.getCountryById = async (req, res) => {
  const { id } = req.params;
  try {
    const country = await prisma.country.findUnique({
      where: { id: parseInt(id) },
      include: {
        departments: true,
        admins: true, // Include admins in the response
      },
    });
    if (!country) return res.status(404).json({ error: "Country not found" });
    res.json(country);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update a country (Admin Only)
exports.updateCountry = async (req, res) => {
  const { id } = req.params;
  const { name, adminId } = req.body;
  if (adminId) {
    const adminUser = await prisma.user.findUnique({
      where: { id: adminId },
      select: { role: true },
    });

    if (!adminUser || adminUser.role !== "countryAdmin") {
      return res
        .status(400)
        .json({ error: "The provided user is not a country admin" });
    }
  }
  try {
    const country = await prisma.country.update({
      where: { id: parseInt(id) },
      data: {
        name,
        admins: adminId ? { connect: { id: adminId } } : undefined,
      },
    });
    res.json(country);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete a country (Admin Only)
exports.deleteCountry = async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.country.delete({
      where: { id: parseInt(id) },
    });
    res.json({ message: "Country deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
