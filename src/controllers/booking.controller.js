const booking = require('../models/Bookings');
const User = require('../models/Users');
const Service = require('../models/Service');
const ProviderAvailability = require('../models/Provider_availabilities');
const sequelize = require('../config/db');
const {
    Op
} = require('sequelize');

const {
    createNotification
} = require('./notification.controller');

exports.createBooking = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            customer_id,
            provider_id,
            service_id,
            booking_date,
            booking_time,
            hours
        } = req.body;

        const serviceData = await Service.findByPk(service_id, {
            transaction: t
        });
        if (!serviceData) {
            await t.rollback();
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        const date = new Date(booking_date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[date.getDay()];

        const availability = await ProviderAvailability.findOne({
            where: {
                userid: provider_id,
                day_of_week: dayName,
                status: {
                    [Op.or]: ['available', 'always available']
                }
            },
            transaction: t
        });
        if (!availability) {
            await t.rollback();
            return res.status(400).json({
                message: 'Provider is not available on this day'
            });
        }
        const existingBooking = await booking.findOne({
            where: {
                provider_id,
                booking_date,
                booking_time,
                status: {
                    [Op.notIn]: ['cancelled', 'rejected']
                }
            },
            transaction: t
        });

        if (existingBooking) {
            await t.rollback();
            return res.status(400).json({
                message: 'Slot already booked'
            });
        }
        let total_amount = 0;
        if (serviceData.price_Type === 'Hourly') {
            total_amount = serviceData.price * (hours || 1);
        } else {
            total_amount = serviceData.price;
        }

        const newBooking = await booking.create({
            customer_id,
            provider_id,
            service_id,
            booking_date,
            booking_time,
            total_amount,
            status: 'pending',
            payment_status: 'pending'
        }, {
            transaction: t
        });
        await createNotification(
            provider_id,
            'booking_status',
            `New booking request for ${serviceData.name} on ${booking_date} at ${booking_time}`,
            newBooking.id,
            'booking', {
                transaction: t
            }
        );

        await t.commit();
        res.status(201).json(newBooking);
    } catch (err) {
        if (t) {
            try {
                await t.rollback();
            } catch (rollbackErr) {
                console.error('Secondary error during rollback:', rollbackErr.message);
            }
        }
        res.status(500).json({
            message: err.message
        });
    }
}

exports.updateStatusBooking = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            status
        } = req.body;
        const bookingData = await booking.findByPk(req.params.id, {
            transaction: t
        });
        if (!bookingData) {
            await t.rollback();
            return res.status(404).json({
                message: 'Booking not found'
            });
        }

        const userRole = req.user.role;
        const currentStatus = bookingData.status;

        // FRD Rule 3.3.3: Customer Cancellation Rule
        if (status === 'cancelled' && userRole === 'customer' && currentStatus !== 'pending') {
            await t.rollback();
            return res.status(400).json({
                message: 'Customer may cancel the booking ONLY if status is Pending'
            });
        }

        const validTransitions = {
            'pending': ['accepted', 'rejected', 'cancelled'],
            'accepted': ['in_progress', 'cancelled', 'customer_completed', 'completed'],
            'in_progress': ['customer_completed', 'completed'],
            'customer_completed': ['completed', 'rejected'] // Provider confirms or disputes (rejects)
        };

        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
            await t.rollback();
            return res.status(400).json({
                message: `Invalid status transition from ${currentStatus} to ${status}`
            });
        }

        let finalStatus = status;

        // FRD Rule 3.3.3: Completion Flow (Customer-Driven Completion)
        if (status === 'completed' && userRole === 'customer') {
            // Check if status is Accepted (or in_progress)
            if (currentStatus !== 'accepted' && currentStatus !== 'in_progress') {
                await t.rollback();
                return res.status(400).json({
                    message: 'Booking must be in Accepted status to be marked as completed'
                });
            }

            // Check if service time has passed (DateTime validation)
            const now = new Date();
            const scheduledDateTime = new Date(`${bookingData.booking_date}T${bookingData.booking_time}`);
            if (now < scheduledDateTime) {
                await t.rollback();
                return res.status(400).json({
                    message: 'You can mark this booking as completed only after the scheduled service time.'
                });
            }

            // If customer marks complete, it first goes to customer_completed
            finalStatus = 'customer_completed';

            // Notify Provider
            await createNotification(
                bookingData.provider_id,
                'booking_update',
                'The customer marked this booking as completed. Do you confirm?',
                bookingData.id,
                'booking', {
                    transaction: t
                }
            );
        }

        // FRD Rule 3.3.3: Final Completion Rule (Provider Confirms)
        if (status === 'completed' && userRole === 'provider') {
            // Provider can confirm completion if status is customer_completed or accepted
            // Note: If they confirm from accepted skip customer_completed for efficiency if allowed, 
            // but usually customer marks first. FRD says "A booking is considered fully completed only after both confirm".
            if (currentStatus !== 'customer_completed' && currentStatus !== 'accepted' && currentStatus !== 'in_progress') {
                await t.rollback();
                return res.status(400).json({
                    message: 'Invalid state for provider to confirm completion'
                });
            }

            // Points calculation and earnings update logic
            const pointsEarned = Math.floor(bookingData.total_amount / 10) || 10;
            const customer = await User.findByPk(bookingData.customer_id, {
                transaction: t
            });
            if (customer) {
                await customer.increment('points', {
                    by: pointsEarned,
                    transaction: t
                });
                await createNotification(
                    bookingData.customer_id,
                    'promotion',
                    `You earned ${pointsEarned} points for your completed booking!`,
                    bookingData.id,
                    'booking', {
                        transaction: t
                    }
                );
            }

            // Update Payment Status
            bookingData.payment_status = 'paid';
        }

        await bookingData.update({
            status: finalStatus,
            payment_status: bookingData.payment_status
        }, {
            transaction: t
        });

        await createNotification(
            bookingData.customer_id,
            'booking_status',
            `Your booking status has been updated to ${finalStatus}`,
            bookingData.id,
            'booking', {
                transaction: t
            }
        );

        await t.commit();
        res.status(200).json(bookingData);
    } catch (err) {
        if (t) {
            try {
                await t.rollback();
            } catch (rollbackErr) {
                console.error('Secondary error during rollback:', rollbackErr.message);
            }
        }
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getAllBookingForProvider = async (req, res) => {
    try {
        const bookings = await booking.findAll({
            where: {
                provider_id: req.params.id
            }
        });
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getAllBookingForCustomer = async (req, res) => {
    try {
        const bookings = await booking.findAll({
            where: {
                customer_id: req.params.id
            }
        });
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getBookingById = async (req, res) => {
    try {
        const bookingData = await booking.findByPk(req.params.id);
        if (!bookingData) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }
        res.status(200).json(bookingData);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getAllBooking = async (req, res) => {
    try {
        const bookings = await booking.findAll();
        res.status(200).json(bookings);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.updateBooking = async (req, res) => {
    try {
        const bookingData = await booking.findByPk(req.params.id);
        if (!bookingData) return res.status(404).json({
            message: 'Booking not found'
        });
        if (req.body.booking_date || req.body.booking_time) {
            const newDate = req.body.booking_date || bookingData.booking_date;
            const newTime = req.body.booking_time || bookingData.booking_time;
            const provider_id = bookingData.provider_id;
            const date = new Date(newDate);
            const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
            const dayName = days[date.getDay()];

            const availability = await ProviderAvailability.findOne({
                where: {
                    userid: provider_id,
                    day_of_week: dayName,
                    status: {
                        [Op.or]: ['available', 'always available']
                    }
                }
            });

            if (!availability) {
                return res.status(400).json({
                    message: 'Provider is not available on this day'
                });
            }
            const existingBooking = await booking.findOne({
                where: {
                    provider_id,
                    booking_date: newDate,
                    booking_time: newTime,
                    status: {
                        [Op.notIn]: ['cancelled', 'rejected']
                    },
                    id: {
                        [Op.ne]: bookingData.id
                    }
                }
            });

            if (existingBooking) {
                return res.status(400).json({
                    message: 'Slot already booked'
                });
            }
        }
        const {
            customer_id,
            provider_id,
            service_id,
            total_amount,
            status, // Should use updateStatusBooking instead
            payment_status, // Handled internally
            ...updateData
        } = req.body;
        await bookingData.update(updateData);
        res.status(200).json(bookingData);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

exports.deleteBooking = async (req, res) => {
    try {
        const bookingData = await booking.findByPk(req.params.id);
        if (!bookingData) {
            return res.status(404).json({
                message: 'Booking not found'
            });
        }
        await bookingData.destroy();
        res.status(200).json({
            message: "Booking deleted successfully"
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}