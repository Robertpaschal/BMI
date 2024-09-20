require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op, DatabaseError} = require('sequelize');
const { isEmail } = require('validator');
const redisClient = require('../config/redis');
const { SendPasswordResetEmail } = require('../utils/emailQueue');
const { error } = require('console');

class AuthController {
    static async signup(req, res) {
        const { email, password, fullname, username, age, gender, country, preferredLanguage, height, weight } = req.body;
        try {
            if (!email) {
                return res.status(400).json({ message: 'Error creating user: Email is required.' });
            }
            if (!isEmail(email)) {
                return res.status(400).json({ message: 'Error creating user: Invalid email format.' });
            }

            if (!password) {
                return res.status(400).json({ message: 'Error creating user: Password is required.' });
            }
            const existingUser = await User.findOne({
                where: {
                    [Op.or]: [
                        { email: email },
                        { username: username },
                    ]
                }
            });

            if (existingUser) {
                let errorMessage = '';

                if (existingUser.email === email) {
                    errorMessage += 'Email is already in use.';
                }
                if (existingUser.username === username) {
                    errorMessage += 'Username is already in use.';
                }

                return res.status(400).json({ message: errorMessage.trim() });
            }

            //Hash the password
            const passwordHash = await bcrypt.hash(password, 10);

            // Create the new user
            const user = await User.create({
                email,
                password: passwordHash,
                fullname,
                username,
                age,
                gender,
                country,
                preferredLanguage,
                height,
                weight,
            });
            res.status(201).json({ message: 'User created successfully', user });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: 'Error connecting to the database', error: error.message});
            }
            res.status(400).json({ message: 'Error creating user', error: error.message });
        }
    }

    static async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ where: { email } });
            if (!user || !(await bcrypt.compare(password, user.password))) {
                return res.status(401).json({ message: 'Invalid credentials' });
            }

            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined in the environment variables');
            }

            const sessionToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, 
                { expiresIn: '1h' });

            const refreshToken = jwt.sign({ userId: user.id }, process.env.JWT_SECRET,
                { expiresIn: '7d' });

            await redisClient.set(`sessionToken:${user.id}`, sessionToken, 3600);
            await redisClient.set(`refreshToken:${user.id}`, refreshToken, 604800);

            res.json({ sessionToken, refreshToken });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: 'Error connecting to the database', error: error.message});
            }
            res.status(400).json({ message: 'Error logging in', error: error.message });
        }
    }

    static async refreshToken(req, res) {
        const { refreshToken } = req.body;

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        try {
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined in the environment variables');
            }

            // Verify and decode the refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);

            // Reconnect to Redis if needed
            await redisClient.reconnect();

            // Retrieve the stored refresh token from Redis
            const storedRefreshToken = await redisClient.get(`refreshToken:${decoded.userId}`);

            // Check if the provided refresh token matches the stored token
            if (storedRefreshToken !== refreshToken) {
                return res.status(403).json({ message: 'Invalid refresh token' });
            }

            // Generate a new session token
            const newToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });

            // Store the new session token in Redis
            await redisClient.set(`sessionToken:${decoded.userId}`, newToken, 3600);

            // Respond with the new session token
            res.json({ sessionToken: newToken });
        } catch (error) {
            res.status(403).json({ message: 'Invalid refresh token', error: error.message });
        }
    }

    static async logout(req, res) {
        const { sessionToken, refreshToken } = req.body;
        if (!sessionToken || !refreshToken) {
            return res.status(400).json({ message: 'Session token and refresh token are required' });
        }
    
        try {
            const decodedSession = jwt.verify(sessionToken, process.env.JWT_SECRET);
            const decodedRefresh = jwt.verify(refreshToken, process.env.JWT_SECRET);

            await redisClient.del(`sessionToken:${decodedSession.userId}`);
            await redisClient.del(`refreshToken:${decodedRefresh.userId}`);
    
            res.status(200).json({ message: 'Logged out successfully' });
        } catch (error) {
            res.status(400).json({ message: 'Error logging out', error: error.message });
        }
    }

    static async requestPasswordReset(req, res) {
        let { email } = req.body;
        if (!email || !isEmail(email)) {
            return res.status(400).json({ message: 'A valid email address is required' });
        }
        email = String(email).trim();
        if (typeof email !== 'string') {
            return res.status(400).json({ message: 'Email must be a string' });
        }

        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ message: 'Invalid email, user not found' });
            }

            await SendPasswordResetEmail(email);
            res.status(200).json({ message: `Password reset email sent to ${email}` });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: 'Error connecting to the database', error: error.message});
            }
            res.status(500).json({ message: 'Error sending password reset email', error: error.message });
        }
    }

    static async Passwordreset(req, res) {
        const { token } = req.query;
        if (!token) {
            return res.status(400).json({message: 'Token is missing', error: error.message });
        }

        // Render a simple HTML form for resetting the password
        res.send(`<form action="/reset-password" method="POST">
            <input type="hidden" name="token" value="${token}" />
            <label for="newPassword">Enter your new password:</label>
            <input type="password" name="newPassword" required />
            <button type="submit">Reset Password</button>
        </form>`);
    }

    static async resetPassword(req, res) {
        const { token, newPassword } = req.body;

        if (!token || !newPassword) {
            return res.status(400).json({ message: 'Token and new password are required', error:error.message });
        }

        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findOne({ where: { id: decoded.userId } });
            if (!user) {
                return res.status(404).json({ message: 'User not found' });
            }
            //compare old and new password
            const isSamePassword = await bcrypt.compare(newPassword, user.password);
            if (isSamePassword) {
                return res.status(404).json({ message: 'New password cannot be the same as old password' });
            }
            // Hash the new password
            const hashedPassword = await bcrypt.hash(newPassword, 10);
            // Update the user's password
            user.password = hashedPassword;
            try {
                await user.save();
            } catch (error) {
                console.error('Error saving user:', error);
                
                if (error instanceof DatabaseError) {
                    return res.status(500).json({ message: 'Error connecting to the database', error: error.message});
                }
                return res.status(500).json({ message: 'Internal server error' });
            }

            return res.status(200).json({ message: 'Password has been successfully reset' });
        } catch (error) {
            console.error('Error resetting password:', error);

            if (error.name === 'DatabaseError') {
                return res.status(500).json({ message: 'Internal server error', error: error.message});
            }
            if (error.name === 'TokenExpiredError') {
                return res.status(400).json({ message: 'Invalid or expired token', error: error.message });
            } else if (error.name === 'JsonWebTokenError') {
                return res.status(400).json({ message: 'Invalid token', error: error.message });
            }
            return res.status(400).json({ message: 'Invalid or expired token', error: error.message });
        }
    }
}

module.exports = AuthController;
