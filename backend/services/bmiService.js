class BMIServices {
    static async calculateBMI(height, weight, age, gender, country) {
        const bmi = weight / (height ** 2);

        // Determine BMI category based on age
        let category;
        if (age < 20) {
            category = await BMIServices.getBMICategoryForChildren(bmi, age, gender, country);
        } else if (age >= 65) {
            category = await BMIServices.getBMICategoryForOlderAdults(bmi, age, gender, country);
        } else {
            category = await BMIServices.getBMICategoryForAdults(bmi, age, gender, country);
        }

        return {
            bmi: bmi.toFixed(2),
            category
        };
    }

    static async getBMICategoryForChildren(bmi, age, gender, country) {
        // Define WHO categories
        const whoCategories = {
            underweight: "Underweight",
            healthyWeight: "Healthy weight",
            overweight: "Overweight",
            obese: "Obese"
        };

        // Country-specific BMI thresholds for children
        const countrySpecificThresholds = {
            'USA': {
                2: { underweight: 14.0, healthy: 16.0, overweight: 19.0 },
                5: { underweight: 14.0, healthy: 17.0, overweight: 19.0 },
                10: { underweight: 16.0, healthy: 20.0, overweight: 24.0 },
            },
            'Japan': {
                2: { underweight: 14.0, healthy: 16.0, overweight: 19.0 },
                5: { underweight: 14.0, healthy: 17.0, overweight: 19.0 },
                10: { underweight: 16.0, healthy: 20.0, overweight: 24.0 },
            }
        };

        // Get thresholds for the specified country or default to an empty object
        const thresholds = countrySpecificThresholds[country] || {};

        // Check the age-specific thresholds for the child
        for (const [ageThreshold, thresholdValues] of Object.entries(thresholds)) {
            if (age < parseInt(ageThreshold)) {
                if (bmi < thresholdValues.underweight) return whoCategories.underweight;
                if (bmi < thresholdValues.healthy) return whoCategories.healthyWeight;
                if (bmi < thresholdValues.overweight) return whoCategories.overweight;
                return whoCategories.obese;
            }
        }

        // Default to WHO standards if no specific thresholds are found
        if (bmi < 18.5) return whoCategories.underweight;
        if (bmi < 24.9) return whoCategories.healthyWeight;
        if (bmi < 29.9) return whoCategories.overweight;
        return whoCategories.obese;
    }

    static async getBMICategoryForOlderAdults(bmi, age, gender, country) {
        // WHO standards for older adults
        const whoThresholds = {
            underweight: 22,
            normal: 27,
            overweight: 30
        };

        // Country-specific thresholds
        const countrySpecificThresholds = {
            'USA': { underweight: 22, normal: 27, overweight: 30 },
            'Germany': { underweight: 21, normal: 26, overweight: 29 },
        };

        // Use country-specific thresholds if available, else default to WHO
        const thresholds = countrySpecificThresholds[country] || whoThresholds;

        // Gender-based thresholds for categorization
        if (gender === 'female') {
            if (bmi < 23) return 'Underweight';
            if (bmi < 28) return 'Normal weight';
            if (bmi < 32) return 'Overweight';
            return 'Obese';
        } else {
            if (bmi < thresholds.underweight) return 'Underweight';
            if (bmi < thresholds.normal) return 'Normal weight';
            if (bmi < thresholds.overweight) return 'Overweight';
            return 'Obese';
        }
    }

    static async getBMICategoryForAdults(bmi, age, gender, country) {
        // WHO standards for adults
        const whoThresholds = {
            underweight: 18.5,
            normal: 24.9,
            overweight: 29.9
        };

        // Country-specific thresholds for adults
        const countrySpecificThresholds = {
            'USA': { underweight: 18.5, normal: 24.9, overweight: 29.9 },
            'Germany': { underweight: 18.0, normal: 23.0, overweight: 27.0 },
            'Japan': { underweight: 18.5, normal: 23, overweight: 27.5 },
        };

        // Use country-specific thresholds if available, else default to WHO
        const thresholds = countrySpecificThresholds[country] || whoThresholds;

        // Gender-based thresholds for categorization
        if (gender === 'female') {
            if (bmi < 18.5) return 'Underweight';
            if (bmi < 23.0) return 'Normal weight';
            if (bmi < 28.0) return 'Overweight';
            return 'Obese';
        } else {
            if (bmi < thresholds.underweight) return 'Underweight';
            if (bmi < thresholds.normal) return 'Normal weight';
            if (bmi < thresholds.overweight) return 'Overweight';
            return 'Obese';
        }
    }
}

module.exports = BMIServices;
