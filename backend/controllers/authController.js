const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op, DatabaseError} = require('sequelize');
const { isEmail } = require('validator');
const redisClient = require('../config/redis');
const EmailQueue = require('../utils/emailQueue');
const { error } = require('console');
const { randomInt } = require('crypto');
const { passport, generateTempPassword } = require('../config/passport');

class AuthController {
    static async verifyEmail(req, res) {
        const { email, password, fullname, username } = req.body;
        try {
            if (!email) {
                return res.status(400).json({ message: 'Error creating user: Email is required.' });
            }
            if (!fullname) {
                return res.status(400).json({ message: 'fullname is required for verification.' });
            }
            if (!username) {
                return res.status(400).json({ message: 'Username is required for verification.' });
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

            const verificationCode = String(randomInt(1000, 9999)); // Generates a number between 1000 and 9999
            await EmailQueue.SendVerificationEmail(email, fullname, verificationCode); // Send verification email asynchronously via background worker
            // Store the verification data temporarily in Redis with a TTL of 10 minutes
            await redisClient.set(
                `verify:${email}`,
                JSON.stringify({ verificationCode, fullname, password, username }),
                600
            );

            res.status(200).json({
                message: `Verification code sent to ${email}. Please verify your account to complete registration.`
            });
            
        } catch (error) {
            res.status(500).json({ message: 'Error during email verification', error: error.message });
        }
    }

    static async signup(req, res) {
        const { email, verificationCode, age, gender, country, preferredLanguage } = req.body;

        if (!email || !verificationCode) {
            return res.status(400).json({ message: 'Email and verification code are required.' });
        }

        try {
            // Retrieve the stored verification data from Redis
            const storedData =  await redisClient.get(`verify:${email}`);
            if (!storedData) {
                return res.status(400).json({ message: 'Verification data expired or invalid.' });
            }

            const { verificationCode: storedCode, fullname, password, username } = JSON.parse(storedData);
            if (storedCode !== verificationCode.toString()) {
                return res.status(400).json({ message: 'Incorrect verification code.' });
            }

            const passwordHash = await bcrypt.hash(password, 10);

             // Create the new user in the database
             const newUser = await User.create({
                email,
                password: passwordHash,
                fullname,
                username,
                age,
                gender,
                country,
                preferredLanguage,
            });

            // Delete the verification code from the Redis after successful verification
            await redisClient.del(`verify:${email}`);

            res.status(201).json({ message: 'User verified and created successfully', user: newUser });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: 'Error connecting to the database', error: error.message });
            }
            res.status(400).json({ message: 'Error verifying email', error: error.message });
        }
    }

    static async login(req, res) {
        const { email, password } = req.body;
        try {
            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(401).json({ message: 'User with inputted credentials cannot be found' });
            }
            const correctpassword = await bcrypt.compare(password, user.password);
            if (!correctpassword) {
                return res.status(401).json({ message: `Incorrect password for ${user.email}` });
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

            const resetCode = randomInt(1000, 9999);
            await redisClient.set(`reset:${email}`, resetCode, 600);
            await EmailQueue.SendPasswordResetEmail(email, resetCode);
            
            res.status(200).json({ message: `Password reset code sent to ${email}` });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: 'Error connecting to the database', error: error.message});
            }
            res.status(500).json({ message: 'Error sending password reset email', error: error.message });
        }
    }

    static async resetPassword(req, res) {
        const { email, resetCode, newPassword } = req.body;

        if (!email || !resetCode || !newPassword) {
            return res.status(400).json({ message: 'Email, reset code, and new password are required' });
        }

        try {
            const storedCode = await redisClient.get(`reset:${email}`);
            if (!storedCode || storedCode !== resetCode) {
                return res.status(400).json({ message: 'Invalid or expired reset code' });
            }

            const user = await User.findOne({ where: { email } });
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

            await redisClient.del(`reset:${email}`); // Remove reset code from Redis
            return res.status(200).json({ message: 'Password has been successfully reset' });
        } catch (error) {
            console.error('Error resetting password:', error);

            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: 'Database error', error: error.message });
            }
            res.status(500).json({ message: 'Error resetting password', error: error.message });
        }
    }

    static async generateTokens(userId) {
        const sessionToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '1h' });
        const refreshToken = jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '7d' });
        await redisClient.set(`sessionToken:${userId}`, sessionToken, 'EX', 3600);
        await redisClient.set(`refreshToken:${userId}`, refreshToken, 'EX', 604800);
        return { sessionToken, refreshToken };
    }

    static async googleAuth(req, res, next) {
        passport.authenticate('google', { scope: ['profile', 'email'] })(req, res, next);
    }

    static async googleCallback(req, res, next) {
        passport.authenticate('google', async (err, user) => {
            if (err || !user) {
                return res.redirect("/login");
            }
            try {
                const tokens = await this.generateTokens(user.id);
                res.json(tokens);
            } catch (error) {
                res.status(500).json({ error: "Error generating tokens", message: error.message });
            }
        })(req, res, next);
    }

    static async facebookAuth(req, res, next) {
        passport.authenticate('facebook', { scope: ['email'] })(req, res, next);
    }

    static async facebookCallback(req, res, next) {
        passport.authenticate('facebook', async (err, user) => {
            if (err || !user) {
                return res.redirect('/login');
            }
            try {
                const tokens = await this.generateTokens(user.id);
                res.json(tokens);
            } catch (error) {
                res.status(500).json({ error: "Error generating tokens", message: error.message });
            }
        })(req, res, next);
    }

    // Once Google or Facebook authentication succeeds, handle the password setting
    static async setPassword(req, res) {
        const { email, tempPassword, password } = req.body;

        try {
            const storedTempPassword = await redisClient.get(`tempPassword:${email}`);

            // If there's no temporary password or it's expired, check the user's socialLogin status
            if (!storedTempPassword) {
                const user = await User.findOne({ where: { email } });
                if (!user) {
                    return res.status(404).json({ error: "User not found" });
                }
                // Only allow generating a new temp password if the user is still in the social login process
                if (!user.socialLogin) {
                    return res.status(400).send({ error: "This user has already set their preferred password."});
                }
                else {
                    // Generate and send a new temporary password
                    try {
                        const renewedTempPassword = await generateTempPassword(user.email, user.fullname);
                        await user.update({ password: renewedTempPassword });
                    } catch (error) {
                        return res.status(500).send({ error: `Error encountered while sending a new temporary password to ${user.email}` });
                    }
                
                    return res.status(400).json({ 
                        error: "Your temporary password has expired, a new one has been sent to your email."
                    });
                }
            }

            // if the temp password exists and is valid, validate it with the user's input
            if (storedTempPassword !== tempPassword) {
                return res.status(400).send({ error: "Invalid temporary password" });
            }

            const user = await User.findOne({ where: { email } });
            if (!user) {
                return res.status(404).json({ error: "User not found" });
            }
            if (!user.socialLogin) {
                return res.status(400).send({ error: "Invalid request. User already has his prefered password."})
            }
            // Ensure the new password is not the same as the temporary password
            const isSameAsTempPassword = await bcrypt.compare(password, storedTempPassword);
            if (isSameAsTempPassword) {
                return res.status(400).send({ error: "You cannot use your temporary password as your actual password." });
            }
            // Hash and save the new  password
            const hashedPassword = await bcrypt.hash(password, 10);
            await user.update({ password: hashedPassword, socialLogin: false });

            // Clear temp password
            await redisClient.del(`tempPassword:${email}`);
            res.status(200).json({ message: "Password successfully set!" });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: 'Database error', error: error.message });
            }
            res.status(500).json({ error: "Failed to set password" });
        }
    }
}

module.exports = AuthController;
