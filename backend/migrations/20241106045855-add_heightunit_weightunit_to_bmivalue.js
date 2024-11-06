'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up (queryInterface, Sequelize) {
    await queryInterface.addColumn('BMIvalue', 'heightunit', {
      type: Sequelize.STRING,
      allowNull: false,
    });
    await queryInterface.addColumn('BMIvalue', 'weightunit', {
      type: Sequelize.STRING,
      allowNull: false,
    });
  },

  async down (queryInterface, Sequelize) {
    await queryInterface.removeColumn('BMIvalue', 'heightunit');
    await queryInterface.removeColumn('BMIvalue', 'weightunit');
  }
};
