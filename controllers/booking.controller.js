const booking = require('../models/Bookings');
const User = require('../models/Users');
const Service = require('../models/Service');
const ServiceAdmin = require('../models/Service_admin');
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
        // Calculate total_amount
        let total_amount = 0;
        if (serviceData.price_Type === 'Hourly') {
            total_amount = serviceData.price * (hours || 1);
        } else if (serviceData.price_Type === 'Free') {
            total_amount = 0;
        } else {
            total_amount = serviceData.price;
        }

        // Strip any points discount from body
        const points_redeemed = req.body.points_redeemed || 0;
        const points_discount = req.body.points_discount || 0;
        const final_amount = Math.max(0, total_amount - points_discount);

        const newBooking = await booking.create({
            customer_id,
            provider_id,
            service_id,
            booking_date,
            booking_time,
            total_amount: final_amount,
            points_redeemed,
            points_discount,
            status: 'pending',
            payment_status: 'pending',
            payment_method: req.body.payment_method || 'cash',
            notes: req.body.notes || null,
            address: req.body.address || null,
            phone: req.body.phone || null
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
            'accepted': ['in_progress', 'completed'],
            'in_progress': ['completed']
        };

        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
            await t.rollback();
            return res.status(400).json({
                message: `Invalid status transition from '${currentStatus}' to '${status}'`
            });
        }

        // FRD Rule 3.3.3: Customer side - check time before completing
        if (status === 'completed' && userRole === 'customer') {
            if (currentStatus !== 'accepted' && currentStatus !== 'in_progress') {
                await t.rollback();
                return res.status(400).json({
                    message: 'Booking must be Accepted or In Progress before marking as completed'
                });
            }
            const now = new Date();
            const scheduledDateTime = new Date(`${bookingData.booking_date}T${bookingData.booking_time}`);
            if (now < scheduledDateTime) {
                await t.rollback();
                return res.status(400).json({
                    message: 'You can mark this booking as completed only after the scheduled service time.'
                });
            }
            await createNotification(
                bookingData.provider_id,
                'booking_status',
                'The customer marked this booking as completed. Please confirm.',
                bookingData.id,
                'booking', {
                    transaction: t
                }
            );
        }

        // FRD Rule 3.3.3: Provider confirms completion -> finalize financials
        if (status === 'completed' && userRole === 'provider') {
            if (currentStatus !== 'accepted' && currentStatus !== 'in_progress') {
                await t.rollback();
                return res.status(400).json({
                    message: 'Invalid state for provider to confirm completion'
                });
            }

            // Calculate commission and provider earning
            const serviceRecord = await Service.findByPk(bookingData.service_id, {
                transaction: t
            });
            let adminCommission = 0;
            if (serviceRecord) {
                if (serviceRecord.commission_type === 'Percentage') {
                    adminCommission = (bookingData.total_amount * (serviceRecord.commission_fee || 0)) / 100;
                } else {
                    adminCommission = serviceRecord.commission_fee || 0;
                }
            }
            const providerEarning = bookingData.total_amount - adminCommission;

            // Award points to customer
            const pointsEarned = Math.floor(bookingData.total_amount / 10) || 1;
            const customer = await User.findByPk(bookingData.customer_id, {
                transaction: t
            });
            if (customer) {
                await customer.update({
                    total_points: (customer.total_points || 0) + pointsEarned,
                    points: (customer.points || 0) + pointsEarned
                }, {
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

            // Update financial fields on the booking record
            bookingData.admin_commission = parseFloat(adminCommission.toFixed(2));
            bookingData.provider_earning = parseFloat(providerEarning.toFixed(2));
            bookingData.points_earned = pointsEarned;
            bookingData.payment_status = 'paid';
        }

        await bookingData.update({
            status: status,
            payment_status: bookingData.payment_status,
            admin_commission: bookingData.admin_commission,
            provider_earning: bookingData.provider_earning,
            points_earned: bookingData.points_earned
        }, {
            transaction: t
        });

        await createNotification(
            bookingData.customer_id,
            'booking_status',
            `Your booking status has been updated to ${status}`,
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
        const bookings = await booking.findAll({
            include: [{
                    model: User,
                    as: 'customer',
                    attributes: ['id', 'name', 'phone', 'email']
                },
                {
                    model: User,
                    as: 'provider',
                    attributes: ['id', 'name', 'phone', 'email']
                },
                {
                    model: Service,
                    attributes: ['id', 'name', 'price', 'price_Type']
                }
            ],
            order: [
                ['createdAt', 'DESC']
            ]
        });
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