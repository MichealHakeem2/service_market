const { Sequelize } = require('sequelize');
const dotenv = require('dotenv');
dotenv.config();


const sequelize = new Sequelize(
    process.env.DB_NAME,
    process.env.DB_USER,
    process.env.DB_PASSWORD, {
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        dialect: 'mysql',
        logging: false,
        pool: {
            max: 20,
            min: 0,
            acquire: 30000,
            idle: 10000
        }
    }
);
async function testConnection() {
    try {
        await sequelize.authenticate();
        console.log('✅ MySQL connected with Sequelize!');
    } catch (err) {
        console.error('❌ Sequelize connection failed:', err);
    }
}
testConnection();
module.exports = sequelize;