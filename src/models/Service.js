const {
    DataTypes
} = require('sequelize');
const sequelize = require('../config/db');
const Service = sequelize.define('Service', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    subcategoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    service_title_id: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    userid: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    price_Type: {
        type: DataTypes.ENUM('Hourly', 'Fixed', 'Free'),
        allowNull: false,
        defaultValue: 'Hourly'
    },
    price: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('accepted', 'pending', 'rejected'),
        allowNull: false,
        defaultValue: 'pending'
    },
    state: {
        type: DataTypes.ENUM('active', 'inactive', 'offline'),
        allowNull: false,
        defaultValue: 'inactive'
    },
    rejectionReason: {
        type: DataTypes.STRING,
        allowNull: true
    },
    approvedAt: {
        type: DataTypes.DATE,
        allowNull: true
    },
    approvedBy: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    images: {
        type: DataTypes.STRING,
        allowNull: true
    },
    rating: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    }
}, {
    tableName: 'service',
    timestamps: true,
});
module.exports = Service;