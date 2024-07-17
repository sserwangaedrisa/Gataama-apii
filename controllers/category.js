const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

exports.createCategory = async (req, res) => {
  try {
    const { name } = req.body; // Destructuring directly from req.body
    if (!name) {
      return res
        .status(400)
        .json({ message: "Name is required in the request body" });
    }

    const category = await prisma.category.create({
      data: { name },
    });
    const response = {
      status: "success",
      message: "Category created successfully",
      data: category,
    };
    res.status(201).json(response);
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.getAllCategories = async (req, res) => {
  try {
    const categories = await prisma.category.findMany();
    const response = {
      status: "success",
      message: "Categories retrieved successfully",
      data: categories,
    };
    res.json(response);
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const category = await prisma.category.findUnique({
      where: { id: parseInt(id, 10) },
    });
    if (!category) {
      return res.status(404).send({ message: "Category not found" });
    }
    const response = {
      status: "success",
      message: "Category retrived successfully",
      data: category,
    };

    res.json(response);
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const category = await prisma.category.update({
      where: { id: parseInt(id, 10) },
      data: { name },
    });
    const response = {
      status: "success",
      message: "Category updated successfully",
      data: category,
    };
    res.json(response);
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
};

exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await prisma.category.delete({
      where: { id: parseInt(id, 10) },
    });
    res.send({ message: "Category deleted successfully" });
  } catch (error) {
    res.status(500).send({ status: "error", message: error.message });
  }
};
