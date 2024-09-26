class BMIServices {
    static async calculateBMI(height, weight, unit)  {
        let bmi;
        if (unit === 'metric') {
            bmi = weight / (height * height);
        } else if (unit === 'imperial') {
            bmi = (weight / (height * height)) * 703;
        }

        let category;
        if (bmi < 18.5) {
            category = 'Underweight';
        } else if (bmi >= 18.5 && bmi < 24.9) {
            category = 'Normal weight';
        } else if (bmi >= 25 && bmi < 29.9) {
            category = 'Overweight';
        } else {
            category = 'Obese';
        }

        return {
            bmi: bmi.toFixed(2),
            category
        };
    }
}

module.exports = BMIServices;