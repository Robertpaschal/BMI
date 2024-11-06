require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });
const { Op, DatabaseError } = require('sequelize');
const User = require('../models/User');
const BMIvalue = require('../models/bmiModel');
const BMIServices = require('../services/bmiService');

class BMIController {
    static async calculateUserBMIData(req, res) {
        try {
            const { userId } = req.user;
            const { height, weight, unit, heightunit, weightunit, age, gender, country } = req.body;

            const user = await User.findOne({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: 'User not found' });

            const requiredFields = { height, weight, unit, heightunit, weightunit, age, gender, country };
            const missingFields = [];
            Object.entries(requiredFields).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') {
                    missingFields.push(key);
                }
            });
            if (missingFields.length > 0) {
                return res.status(400).json({ message: `Incomplete input data. Missing fields: ${missingFields.join(', ')}` });
            }

            // Validate and set conversion factors
            const metricUnits = unit === 'metric' && ['m', 'cm'].includes(heightunit) && ['kg', 'g'].includes(weightunit);
            const imperialUnits = unit === 'imperial' && ['ft', 'in'].includes(heightunit) && ['lbs', 'st'].includes(weightunit);
            if (!metricUnits && !imperialUnits) {
                return res.status(400).json({ message: 'Unit and measurement types are incompatible' });
            }

            let parsedHeight = parseFloat(height);
            let parsedWeight = parseFloat(weight);
            // Ensure height and weight are valid numbers
            if (isNaN(parsedHeight) || isNaN(parsedWeight)) {
                return res.status(400).json({ message: 'Height and weight must be valid numbers' });
            }

            // Convert units: Metric - cm to m, g to kg; Imperial - ft/in to m, st/lbs to kg
            if (unit === 'metric') {
                if (heightunit === 'cm') parsedHeight /= 100;
                if (weightunit === 'g') parsedWeight /= 1000;
            } else {
                if (heightunit === 'ft') parsedHeight *= 0.3048;
                else if (heightunit === 'in') parsedHeight *= 0.0254;
                if (weightunit === 'st') parsedWeight *= 6.35029;
                else if (weightunit === 'lbs') parsedWeight *= 0.453592;
            }

            const { bmi, category } = await BMIServices.calculateBMI(parsedHeight, parsedWeight, age, gender, country);
            await BMIvalue.create({
                userId: user.id,
                height,
                weight,
                heightunit,
                weightunit,
                calculationUnit: unit,
                bmi: parseFloat(bmi),
                category,
            });

            user.height = parsedHeight;
            user.weight = parsedWeight;
            user.age = age;
            user.country = country;
            user.gender = gender;
            await user.save();

            return res.status(200).json({ bmi, category });
            
        } catch (error) {
            if (error instanceof DatabaseError) {
                return this.handleDatabaseError(res, error);
            }
            return res.status(500).json({ message: 'Internal server error', error: error.message });
        }
    }

    static async getUserBMIHistory(req, res) {
        try {
            const { userId } = req.user;
            const page = parseInt(req.query.page) || 1;
            const limit = parseInt(req.query.limit) || 10;

            if (page < 1 || limit < 1) {
                return res.status(400).json({ message: 'Page and limit should be positive integers' });
            }

            const user = await User.findOne({ where: { id: userId } });
            if (!user) return res.status(404).json({ message: 'User not found' });

            const bmiHistory = await BMIvalue.findAndCountAll({
                where: { userId: userId },
                attributes: ['height', 'weight', 'heightunit', 'weightunit', 'calculationUnit', 'bmi', 'category', 'createdAt'],
                order: [['createdAt', 'DESC']],
                limit: limit,
                offset: (page - 1) * limit
            });

            if (page > Math.ceil(bmiHistory.count / limit)) {
                return res.status(404).json({ message: 'Requested page exceeds available data' });
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
                return this.handleDatabaseError(res, error);
            }
            return res.status(500).json({ message: 'An error occurred while retrieving BMI records', error: error.message });
        }
    }

    static handleDatabaseError(res, error) {
        return res.status(500).json({
            message: "Database Error",
            error: error.message
        });
    }
}

module.exports = BMIController;
