const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Portal = sequelize.define('Portal', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    portalType: {
        type: DataTypes.STRING,
        allowNull: false
    }
});
module.exports = Portal;