const express = require("express");
const categoryController = require("../controllers/category");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { isAdmin } = require("../middleware/role");

/**
 * @openapi
 * /categories:
 *   get:
 *     tags:
 *       - Category
 *     summary: get all categories
 *     responses:
 *       200:
 *        description: successful retrival
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Categories'
 *       500:
 *         description: server error    
 */
router.get("/", categoryController.getAllCategories);

/**
 * @openapi
 * /categories:
 *   post:
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     summary: create category
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       201:
 *         description: category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       400:
 *         description: empty field
 *       403:
 *         description: unauthorized
 *       500:
 *         description: sever error
 */
router.post("/", verifyToken, isAdmin, categoryController.createCategory);

/**
 * @openapi
 * /categories/{id}:
 *   get:
 *     tags:
 *       - Category
 *     summary: get category by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *        description: successful retrival
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/Category'
 *       500:
 *         description: server error    
 */
router.get("/:id", categoryController.getCategoryById);

/**
 * @openapi
 * /categories/{id}:
 *   put:
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     summary: update category
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: interger
 *         description: User id
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: 'object'
 *             properties:
 *               name:
 *                 type: string
 *     responses:
 *       200:
 *         description: category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Category'
 *       403:
 *         description: unauthorized
 *       500:
 *         description: sever error
 */
router.put("/:id", verifyToken, isAdmin, categoryController.updateCategory);

/**
 * @openapi
 * /categories/{id}:
 *   delete:
 *     tags:
 *       - Category
 *     security:
 *       - bearerAuth: []
 *     summary: delete category by id
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: interger
 *         description: user id
 *     responses:
 *       200:
 *         description: category created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *       403:
 *         description: unauthorized
 *       500:
 *         description: sever error
 */
router.delete("/:id", verifyToken, isAdmin, categoryController.deleteCategory);

module.exports = router;
