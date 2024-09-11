require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op} = require('sequelize');
const { isEmail } = require('validator');
const redisClient = require('../config/redis');

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
            res.status(400).json({ message: 'Error logging in', error: error.message });
        }
    }

    static async refreshToken(req, res) {
        const { refreshToken } = req.body;
        console.log(`Refresh token received for refresh: ${refreshToken}`);

        if (!refreshToken) {
            return res.status(401).json({ message: 'Refresh token is required' });
        }

        try {
            if (!process.env.JWT_SECRET) {
                throw new Error('JWT_SECRET is not defined in the environment variables');
            }

            // Verify and decode the refresh token
            const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
            console.log(`Decoded refresh token: ${JSON.stringify(decoded)}`);

            // Reconnect to Redis if needed
            await redisClient.reconnect();

            // Retrieve the stored refresh token from Redis
            const storedRefreshToken = await redisClient.get(`refreshToken:${decoded.userId}`);
            console.debug(`Stored refresh token for user ${decoded.userId}: ${storedRefreshToken}`);

            // Check if the provided refresh token matches the stored token
            if (storedRefreshToken !== refreshToken) {
                console.log('Provided refresh token does not match stored refresh token');
                return res.status(403).json({ message: 'Invalid refresh token' });
            }

            // Generate a new session token
            const newToken = jwt.sign({ userId: decoded.userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
            console.log(`Generated new session token: ${newToken}`);

            // Store the new session token in Redis
            await redisClient.set(`sessionToken:${decoded.userId}`, newToken, 3600);
            console.log(`New session token stored in Redis for user ${decoded.userId}`);

            // Respond with the new session token
            res.json({ sessionToken: newToken });
        } catch (error) {
            console.log('Error during refresh token process:', error.message);
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
    
}

module.exports = AuthController;
