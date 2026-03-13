const Booking = require('../models/Bookings');
const User = require('../models/Users');
const Service = require('../models/Service');
const sequelize = require('../config/db');
const {
    Op
} = require('sequelize');

exports.getCustomerStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Active bookings (pending, accepted, in_progress)
        const activeBookings = await Booking.count({
            where: {
                customer_id: userId,
                status: {
                    [Op.in]: ['pending', 'accepted', 'in_progress']
                }
            }
        });

        // Completed bookings
        const completedBookings = await Booking.count({
            where: {
                customer_id: userId,
                status: 'completed'
            }
        });
        const user = await User.findByPk(userId);
        const points = user ? user.points : 0;
        const pendingPayments = await Booking.count({
            where: {
                customer_id: userId,
                payment_status: 'pending',
                status: {
                    [Op.notIn]: ['cancelled', 'rejected']
                }
            }
        });

        res.status(200).json({
            activeBookings,
            completedBookings,
            points,
            pendingPayments
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.getProviderStats = async (req, res) => {
    try {
        const userId = req.user.id;

        // Upcoming bookings (accepted)
        const upcomingBookings = await Booking.count({
            where: {
                provider_id: userId,
                status: 'accepted'
            }
        });

        // Pending requests
        const pendingRequests = await Booking.count({
            where: {
                provider_id: userId,
                status: 'pending'
            }
        });

        // Total Earnings (completed bookings)
        const earningsResult = await Booking.sum('total_amount', {
            where: {
                provider_id: userId,
                status: 'completed'
            }
        });
        const totalEarnings = earningsResult || 0;

        // Rating (if we had a Review model, we would calculate avg here. For now use User.rating)
        // Note: The User model has a 'rating' field but it's not being updated automatically yet.
        const user = await User.findByPk(userId);
        const rating = user ? user.rating : 0;

        res.status(200).json({
            upcomingBookings,
            pendingRequests,
            totalEarnings,
            rating
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.getAdminStats = async (req, res) => {
    try {
        const totalBookings = await Booking.count();
        const pendingBookings = await Booking.count({
            where: {
                status: 'pending'
            }
        });
        const totalCustomers = await User.count({
            where: {
                role: 'customer'
            }
        });
        const activeProviders = await User.count({
            where: {
                role: 'provider',
                status: 'active'
            }
        });
        const totalSpent = await Booking.sum('total_amount', {
            where: {
                status: 'completed'
            }
        }) || 0;

        // Recently registered users
        const recentUsers = await User.findAll({
            limit: 5,
            order: [
                ['createdAt', 'DESC']
            ],
            attributes: ['id', 'name', 'email', 'role', 'createdAt']
        });

        // Recent bookings
        const recentBookings = await Booking.findAll({
            limit: 5,
            order: [
                ['createdAt', 'DESC']
            ],
            include: [{
                    model: User,
                    as: 'customer',
                    attributes: ['name']
                },
                {
                    model: User,
                    as: 'provider',
                    attributes: ['name']
                }
            ]
        });

        res.status(200).json({
            totalBookings,
            pendingBookings,
            totalCustomers,
            activeProviders,
            totalSpent,
            recentUsers,
            recentBookings
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};