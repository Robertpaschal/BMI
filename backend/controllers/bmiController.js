require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Op, DatabaseError } = require('sequelize');
const { error } = require('console');
const User = require('../models/User');
const BMIvalue = require('../models/bmiModel');
const BMIServices = require('../services/bmiService');

class BMIController {
    static async calculateUserBMIData(req, res) {
        try {
            const { userId } = req.user;
            const { height, weight, unit } = req.body;
            const user = await User.findOne({ where: { id: userId } });

            if (!user) {
                return res.status(404).json({ message: 'User not found', error: error.message });
            }
            if (!height || !weight || !unit) {
                return res.status(400).json({ message: 'Incomplete input data' });
            }
            if (unit !== 'metric' && unit !== 'imperial') {
                return res.status(400).json({ message: 'Unit field should have value of metric or imperial', error: error.message });
            }
            if (isNaN(height) || isNaN(weight) || typeof height !== 'number' || typeof weight !== 'number') {
                return res.status(400).json({ message: 'Height and weight must be a valid float number' });
            }

            const { bmi, category } = await BMIServices.calculateBMI(height, weight, unit);

            user.height = height;
            user.weight = weight;
            await user.save();

            await BMIvalue.create({
                userId: user.id,
                height: parseFloat(height),
                weight: parseFloat(weight),
                calculationUnit: unit,
                bmi: parseFloat(bmi),
                category,
            });

            return res.status(200).json({ bmi, category });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ message: "Database Error", error: error.message });
            }
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    };

    static async getUserBMIHistory(req, res) {
        try{
            const { userId } = req.user;
            const { page = 1, limit = 10 } = req.query;

            const user = await User.findOne({ where: { id: userId } });
            if (!user) {
                return res.status(404).json({ message: 'User not found', error: error.message });
            }

            const bmiHistory =  await BMIvalue.findAndCountAll({
                where: {
                    userId: userId
                },
                attributes: ['height', 'weight', 'calculationUnit', 'bmi', 'category', 'createdAt'],
                order: [['createdAt', 'DESC']],
                limit: parseInt(limit),
                offset: (page - 1) * limit
            });

            if (bmiHistory.count === 0) {
                return res.status(200).json({
                    message: `No BMI records found for user ${user.fullname}.`,
                    data: [],
                });
            }

            return res.status(200).json({
                message: 'BMI records retrieved successfully',
                total: bmiHistory.count,
                currentPage: page,
                totalPages: Math.ceil(bmiHistory.count / limit),
                data: bmiHistory.rows,
            });
        } catch (error) {
            if (error instanceof DatabaseError) {
                return res.status(500).json({ 
                    message: "Database Error", 
                    error: error.message 
                });
            }
            return res.status(500).json({
                message: 'An error occurred while retrieving BMI records',
                error: error.message
            });
        }
    };
}

module.exports = BMIController;