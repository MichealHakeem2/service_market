const {
    DataTypes
} = require('sequelize');
const sequelize = require('../config/db');

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    customer_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    provider_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    service_id: {
        type: DataTypes.INTEGER,
        allowNull: false
    },
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled'),
        defaultValue: 'pending'
    },
    booking_date: {
        type: DataTypes.DATEONLY,
        allowNull: false
    },
    booking_time: {
        type: DataTypes.TIME,
        allowNull: false
    },
    phone: {
        type: DataTypes.STRING,
        allowNull: true
    },
    address: {
        type: DataTypes.STRING,
        allowNull: true
    },
    location: {
        type: DataTypes.STRING,
        allowNull: true
    },
    total_amount: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 0
    },
    admin_commission: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    provider_earning: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    points_earned: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    points_redeemed: {
        type: DataTypes.INTEGER,
        allowNull: true,
        defaultValue: 0
    },
    points_discount: {
        type: DataTypes.FLOAT,
        allowNull: true,
        defaultValue: 0
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending'
    },
    payment_method: {
        type: DataTypes.ENUM('cash', 'online'),
        defaultValue: 'cash'
    },
    notes: {
        type: DataTypes.TEXT,
        allowNull: true
    }
}, {
    tableName: 'bookings',
    timestamps: true
});

module.exports = Booking;