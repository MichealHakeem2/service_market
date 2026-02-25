const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');
const Provider_availabilities = sequelize.define('Provider_availabilities', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    serviceId: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    userid: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    day_of_week: {
        type: DataTypes.STRING,
        allowNull: false
    },
    start_time: {
        type: DataTypes.STRING,
        allowNull: false
    },
    end_time: {
        type: DataTypes.STRING,
        allowNull: true
    },
    status: {
        type: DataTypes.ENUM('available', 'always available', 'holiday', 'day off'),
        allowNull: false,
        defaultValue: "available"
    },
    holiday: {
        type: DataTypes.ENUM('not holiday', 'holiday'),
        allowNull: true,
        defaultValue: "not holiday"
    }
}, {
    tableName: 'provider_availabilities',
    timestamps: false,
});
module.exports = Provider_availabilities;