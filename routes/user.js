const express = require('express');
const UserController = require('../controllers/users');
const checkAuth = require('../middleware/check-auth');
const validation = require('../middleware/validation');

const router = express.Router();

router.post('/register', validation.registerUserPolicy, UserController.register);

router.post('/login', validation.loginUserPolicy, UserController.login);

router.patch('/forgotPassword', validation.forgotPasswordPolicy, UserController.forgotPassword);

router.patch(
  '/profile/:id',
  checkAuth,
  validation.userprofilePolicy,
  UserController.fillProfile,
);

router.delete('/:id', checkAuth, UserController.deleteUser);

module.exports = router;
