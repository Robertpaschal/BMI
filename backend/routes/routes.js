const express = require('express');
const AuthController = require('../controllers/authController');

const router = express.Router();

// authentication routes

/**
 * @swagger
 * /signup:
 *   post:
 *     summary: Sign up a new user
 *     description: Create a new user account
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               fullname:
 *                 type: string
 *               username:
 *                 type: string
 *               age:
 *                 type: integer
 *               gender:
 *                 type: string
 *               country:
 *                 type: string
 *               preferredLanguage:
 *                 type: string
 *               height:
 *                 type: number
 *                 format: float
 *               weight:
 *                 type: number
 *                 format: float
 *     responses:
 *       201:
 *         description: User created successfully.
 *       400:
 *         description: Error creating user, Bad Request.
 */
router.post('/signup', AuthController.signup);

/**
 * @swagger
 * /login:
 *   post:
 *     summary: Log in a user
 *     description: Authenticate a user and return a token.
 *     requestBody:
 *       required: true
 *       content: 
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: User logged in successfully.
 *       400:
 *         description: Error logging in
 *       401:
 *         description: Unauthorized.
 */
router.post('/login', AuthController.login);

/**
 * @swagger
 * /refresh-token:
 *   post:
 *     summary: Refresh the authentication token
 *     description: Refresh the user's token if it is about to expire.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               refreshToken:
 *                 type: string
 *                 description: The current authentication token that is about to expire.
 *     responses:
 *       200:
 *         description: Token refreshed successfully.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                   description: The new refreshed token.
 *       400:
 *         description: Error refreshing token, Bad Request.
 *       401:
 *         description: Unauthorized, invalid or expired token.
 */
router.post('/refresh-token', AuthController.refreshToken);

module.exports = router;
