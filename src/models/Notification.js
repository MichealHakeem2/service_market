const {
    DataTypes
} = require('sequelize');
const sequelize = require('../config/db');
const User = require('./Users');

const Notification = sequelize.define('Notification', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    userId: {
        type: DataTypes.INTEGER,
        allowNull: false,
        references: {
            model: User,
            key: 'id'
        }
    },
    type: {
        type: DataTypes.ENUM('booking_status', 'payment', 'system', 'promotion'),
        allowNull: false
    },
    message: {
        type: DataTypes.STRING,
        allowNull: false
    },
    readStatus: {
        type: DataTypes.ENUM('unread', 'read'),
        defaultValue: 'unread'
    },
    relatedId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    relatedType: {
        type: DataTypes.STRING,
        allowNull: true
    }
}, {
    tableName: 'notifications',
    timestamps: true
});

module.exports = Notification;