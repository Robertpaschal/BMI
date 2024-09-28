const { Sequelize } =  require('sequelize');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const sequelize = new Sequelize(process.env.DATABASE_URL, {
    dialect: 'postgres',
    logging: false,
});

(async () => {
    try {
        await sequelize.authenticate();
        console.log('Connection to the database has been established successfully.');
    } catch (error) {
        console.error('Unable to connect to the database:', error);
    }
})();

module.exports = sequelize;
