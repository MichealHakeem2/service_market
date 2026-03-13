const {
    DataTypes
} = require('sequelize');
const sequelize = require('../config/db');
const ServiceAdmin = sequelize.define('ServiceAdmin', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    subcategory_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    description: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive', 'offline'),
        allowNull: false,
        defaultValue: 'inactive'
    },
    price: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    },
    commission_type: {
        type: DataTypes.ENUM('Fixed', 'Percentage'),
        defaultValue: 'Percentage'
    },
    commission_fee: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    discount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    price_Type: {
        type: DataTypes.ENUM('Hourly', 'Fixed', 'Free'),
        allowNull: false,
        defaultValue: 'Hourly'
    }
}, {
    tableName: 'service_admin',
    timestamps: true,
});
module.exports = ServiceAdmin;