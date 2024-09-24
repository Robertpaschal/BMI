require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const User = require('../models/User');
const { DatabaseError} = require('sequelize');
const { error } = require('console');

class UserController {
    static async fetchUserProfile(req, res) {
        try {
            const { userId } = req.user
            const user = await User.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: 'User not found', error: error.message });
            }

            return res.status(200).json({
                fullname: user.fullname,
                username: user.username,
                age: user.age,
                gender: user.gender,
                country: user.country,
                height: user.height,
                weight: user.weight,
                preferredLanguage: user.preferredLanguage,
                last_updated_at: user.updatedAt,
                created_at: user.createdAt
            });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: "Connection to the database caanot be established", error: error.message });
            }
            return res.status(500).json({ message: "User's details cannot be fetched at the moment", error: error.message });
        }
    }

    static async updateProfile(req, res) {
        const { fullname, username, age, gender, country, height, weight, preferredLanguage } = req.body;

        try {
            const { userId } = req.user;
            
            const user = await User.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: 'User not found', error: error.message });
            }

            if (fullname !== undefined) {
                if (typeof fullname !== 'string') {
                    return res.status(400).json({ message: 'Fullname must be a string' });
                }
                user.fullname = fullname;
            }
            if (username !== undefined) {
                if (typeof username !== 'string') {
                    return res.status(400).json({ message: 'Username must be a string' });
                }
                user.username = username;
            }
            if (age !== undefined) {
                if (isNaN(age) || age <= 0) {
                    return res.status(400).json({ message: 'Invalid age provided. Age must be a positve number' });
                }
                user.age = age;
            }
            if (gender !== undefined) {
                if (typeof gender !== 'string') {
                    return res.status(400).json({ message: 'Gender must be a string' });
                }
                user.gender = gender;
            }
            if (country !== undefined) {
                if (typeof country !== 'string') {
                    return res.status(400).json({ message: 'Country must be a string' });
                }
                user.country = country;
            }
            if (height !== undefined) {
                if (isNaN(height) || typeof height !== 'number') {
                    return res.status(400).json({ message: 'Height must be a valid float number' });
                }
                user.height = parseFloat(height);
            }
            if (weight !== undefined) {
                if (isNaN(weight) || typeof weight !== 'number') {
                    return res.status(400).json({ message: 'Weight must be a valid float number' });
                }
                user.weight = parseFloat(weight);
            }
            if (preferredLanguage !== undefined) {
                if (typeof preferredLanguage !== 'string') {
                    return res.status(400).json({ message: 'Preferred language must be a string' });
                }
                user.preferredLanguage = preferredLanguage;
            }

            try {
                await user.save();
            } catch (error) {
                console.error('Error saving user:', error);
                
                if (error instanceof DatabaseError) {
                    return res.status(500).json({ message: 'Error connecting to the database', error: error.message});
                }
                return res.status(500).json({ message: 'Internal server error' });
            }

            return res.status(200).json({
                message: 'Profile updated successfully',
                user: {
                    fullname: user.fullname,
                    username: user.username,
                    age: user.age,
                    gender: user.gender,
                    country: user.country,
                    preferredLanguage: user.preferredLanguage,
                    height: user.height,
                    weight: user.weight,
                    last_updated_at: user.updatedAt,
                    created_at: user.createdAt
                }
            });
        } catch (error) {
            return res.status(500).json({ message: "User's details cannot be updated at the moment", error: error.message });
        }
    }

    static async deleteProfile(req, res) {
        try {
            const { userId } = req.user;

            const user = await User.findOne({ where: { id: userId } });
            if(!user) {
                return res.status(404).json({ message: "User not found", error:error.message });
            }

            await user.destroy();

            return res.status(200).json({ message: "User profile and account deleted successfully" });
        } catch (error) {
            console.error('Error deleting user:', error);

            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: 'Error connecting to the database', error: error.message});
            }
            return res.status(500).json({ message: "User's account cannot be deleted at the moment", error: error.message });
        }
    }
}

module.exports = UserController;