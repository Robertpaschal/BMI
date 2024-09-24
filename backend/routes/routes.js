const express = require('express');
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const UserController = require('../controllers/userController');

const router = express.Router();

// authentication routes
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.get('/reset-password', AuthController.Passwordreset);
router.post('/reset-password', AuthController.resetPassword);

// profile management routes
router.get('/profile', AuthMiddleware.verifyToken, UserController.fetchUserProfile);
router.put('/profile', AuthMiddleware.verifyToken, UserController.updateProfile);
router.delete('/profile', AuthMiddleware.verifyToken, UserController.deleteProfile);

module.exports = router;
