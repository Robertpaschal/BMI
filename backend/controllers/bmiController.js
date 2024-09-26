require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { DatabaseError} = require('sequelize');
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
                bmi: parseFloat(bmi),
                calculationUnit: unit,
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
}

module.exports = BMIController;