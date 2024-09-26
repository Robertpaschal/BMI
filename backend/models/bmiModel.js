const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const User = require('./User');

const BMIvalue = sequelize.define('BMI', {
    id: { 
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    userId: {
        type: DataTypes.INTEGER,
        references: { 
            model: 'User',
            key: 'id'
        } 
    },
    bmi: { 
        type: DataTypes.FLOAT, 
        allowNull: false 
    },
    calculationUnit: {
        type: DataTypes.STRING,
        allowNull: false
    },
    category: {
        type: DataTypes.STRING,
        allowNull: false
    },
}, {
    timestamps: true,
    tableName: 'BMIvalue',
});

BMIvalue.associate = (models) => {
    BMIvalue.belongsTo(models.User, { foreignKey: 'userId' });
};


module.exports = BMIvalue;