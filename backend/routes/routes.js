const express = require('express');
const AuthController = require('../controllers/authController');
const AuthMiddleware = require('../middlewares/authMiddleware');
const UserController = require('../controllers/userController');
const BMIController = require('../controllers/bmiController');

const router = express.Router();

// OAuth login routes
router.get('/auth/google', AuthController.googleAuth);
router.get('/auth/google/callback', AuthController.googleCallback);
router.get('/auth/facebook', AuthController.facebookAuth);
router.get('/auth/facebook/callback', AuthController.facebookCallback);
router.post('/set-password', AuthController.setPassword);

// authentication routes
router.post('/verify-email', AuthController.verifyEmail);
router.post('/signup', AuthController.signup);
router.post('/login', AuthController.login);
router.post('/refresh-token', AuthController.refreshToken);
router.post('/logout', AuthController.logout);
router.post('/request-password-reset', AuthController.requestPasswordReset);
router.post('/reset-password', AuthController.resetPassword);

// profile management routes
router.get('/profile', AuthMiddleware.verifyToken, UserController.fetchUserProfile);
router.put('/profile', AuthMiddleware.verifyToken, UserController.updateProfile);
router.delete('/profile', AuthMiddleware.verifyToken, UserController.deleteProfile);

// bmi management routes
router.post('/bmi/calculate', AuthMiddleware.verifyToken, BMIController.calculateUserBMIData);
router.get('/bmi/history', AuthMiddleware.verifyToken, BMIController.getUserBMIHistory);

module.exports = router;
