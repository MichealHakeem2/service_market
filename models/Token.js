const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Token = sequelize.define('Token', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    token: {
        type: DataTypes.STRING,
        allowNull: false
    },
    user_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'expired', 'deleted'),
        allowNull: true
    }
}, {
    tableName: 'token',
    timestamps: true,
});
module.exports = Token;