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

        // Points balance
        const user = await User.findByPk(userId);
        const points = user ? user.points : 0;

        // Pending payments (bookings that are completed or active but payment_status is pending?)
        // Assuming payment is pending if status is not cancelled/rejected and payment_status is pending
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