const express = require("express");
const UserController = require("../controllers/users");
const checkAuth = require("../middleware/check-auth");
const validation = require("../middleware/validation");
const passport = require("passport");
const router = express.Router();
const verifyToken = require("../middleware/auth");
const { isAdmin } = require("../middleware/role");


/**
 * @openapi
 * /user/register:
 *   post:
 *     tags:
 *       - User
 *     summary: creates user's account
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserInput'
 *     responses:
 *       201:
 *         description: user created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RegisterUserResponse'
 *       400:
 *         description: error in account creation
 *       403:
 *         description: error in input values
 *       404:
 *         description: unauthorized
 */
router.post(
  "/register",
  verifyToken,
  isAdmin,
  validation.registerUserPolicy,
  UserController.register
);

/**
 * @openapi
 * /user/login:
 *   post:
 *     tags:
 *       - User
 *     summary: authorization
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginUserInput'
 *     responses:
 *       200:
 *         description: logged in successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/LoginUserResponse'
 *       403:
 *         description: account is locked
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       406:
 *         description: invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: invalid email or password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.post("/login", validation.loginUserPolicy, UserController.login);

/**
 * @openapi
 * /user/forgotpassword:
 *   patch:
 *     tags:
 *       - User
 *     summary: request new password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RequestNewPassword'
 *     responses:
 *       200:
 *         description: password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       403:
 *         description: account issue
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       500:
 *         description: error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.patch(
  "/forgotPassword",
  validation.forgotPasswordPolicy,
  UserController.forgotPassword
);

/**
 * @openapi
 * /user/profile/:id:
 *   put:
 *     tags:
 *       - User
 *     summary: updated user by id
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: interger
 *         description: User Id
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterUserInput'
 *     responses:
 *       200:
 *         description: user updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/SuccessResponse'
 *       400:
 *         description: error occured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 *       404:
 *         description: user not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponse'
 */
router.put(
  "/profile/:id",
  verifyToken,
  isAdmin,
  UserController.updateUser
);

/**
 * @openapi
 * /user/:id:
 *  delete:
 *    tags:
 *      - User
 *    summary: delete user by id
 *    security:
 *      - bearerAuth: []
 *    parameters:
 *      - name: id
 *        in: path
 *        required: true
 *        schema:
 *          type: interger
 *        description: User Id
 *    responses:
 *      200:
 *        description: user deleted successfully
 *        content:
 *          application/json:
 *            schema:
 *              $ref: '#/components/schemas/SuccessResponse'
 *      400:
 *        description: error occured
 *      404:
 *        description: user not found
 */
router.delete("/:id",verifyToken, isAdmin, UserController.deleteUser);

router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * @openapi
 * /user/admins:
 *   get:
 *     tags:
 *       - User
 *     security:
 *       - bearerAuth: []
 *     summary: retrive all admin accounts
 *     responses:
 *       200:
 *         description: retrival successfull
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RetriveAdmins'
 */
router.get(
  "/admins", checkAuth, UserController.getAdmin)

router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: "/login",
  }),
  (req, res) => {
    const { token } = req.user;
    res.redirect(`${process.env.CLIENT_URL}?token=${token}`);
  }
);

router.get("/check-user", verifyToken, UserController.getUserFromToken);

module.exports = router;
