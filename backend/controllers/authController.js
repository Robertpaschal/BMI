const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { Op} = require('sequelize');
const { isEmail } = require('validator'); 

require('dotenv').config();

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
            const token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET, 
                { expiresIn: '1h' }
            );
            res.json({ token });
        } catch (error) {
            res.status(400).json({ message: 'Error logging in', error });
        }
    }
}

module.exports = AuthController;
