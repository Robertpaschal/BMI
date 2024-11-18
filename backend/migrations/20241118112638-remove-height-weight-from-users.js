'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.removeColumn('User', 'height');
    await queryInterface.removeColumn('User', 'weight');
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.addColumn('User', 'height', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
    await queryInterface.addColumn('User', 'weight', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });
  }
};
