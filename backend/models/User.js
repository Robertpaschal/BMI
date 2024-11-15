const { DataTypes } = require('sequelize');
const sequelize = require('../config/sequelize');
const BMIvalue = require('./bmiModel');

const User = sequelize.define('User', {
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
            isEmail: true,
        },
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    socialLogin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    isSocialLogin: {
        type: DataTypes.BOOLEAN,
        defaultValue: false
    },
    fullname: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
    },
    age: {
        type: DataTypes.INTEGER,
        allowNull: false,
    },
    gender: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    country: {
        type: DataTypes.STRING,
        allowNull: false
    },
    preferredLanguage: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    height: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
    weight: {
        type: DataTypes.FLOAT,
        allowNull: false,
    },
}, {
    timestamps: true,
    tableName: 'User',
});

User.associate = (models) => {
    User.hasMany(models.BMIvalue, { foreignKey: 'userId' });
};

module.exports = User;
