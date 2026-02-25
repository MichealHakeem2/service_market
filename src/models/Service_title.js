const {
    DataTypes
} = require('sequelize');
const sequelize = require('../config/db');
const Service_title = sequelize.define('Service_title', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    subcategory_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    }
}, {
    tableName: 'service_title',
    timestamps: false,
});
module.exports = Service_title;