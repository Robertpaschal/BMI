'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.changeColumn('User', 'gender', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.changeColumn('User', 'gender', {
      type: Sequelize.ENUM('male', 'female', 'other'),
      allowNull: false,
    });
  }
};
