const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

// authentication routes
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);

module.exports = router;
