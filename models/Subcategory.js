const {
    DataTypes
} = require('sequelize');
const sequelize = require('../config/db');
const Subcategory = sequelize.define('Subcategory', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    image: {
        type: DataTypes.STRING,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('active', 'inactive'),
        allowNull: false,
        defaultValue: "active"
    },
    description: {
        type: DataTypes.STRING,
        allowNull: true
    },
    categoryId: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'subcategory',
    timestamps: true,
});
module.exports = Subcategory;