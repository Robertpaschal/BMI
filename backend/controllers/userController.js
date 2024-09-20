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
}

module.exports = UserController;