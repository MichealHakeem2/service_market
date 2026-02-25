const {
    Sequelize,
    DataTypes,
    Op
} = require('sequelize');
const sequelize = new Sequelize('new_api', 'root', '', {
    host: 'localhost',
    dialect: 'mysql',
    logging: false
});

// Define Models (Minimal for testing)
const User = sequelize.define('User', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: DataTypes.STRING,
    role: DataTypes.ENUM('customer', 'provider', 'admin'),
    points: {
        type: DataTypes.INTEGER,
        defaultValue: 0
    }
}, {
    tableName: 'users',
    timestamps: true
});

const Booking = sequelize.define('Booking', {
    id: {
        type: DataTypes.INTEGER,
        autoIncrement: true,
        primaryKey: true
    },
    customer_id: DataTypes.INTEGER,
    provider_id: DataTypes.INTEGER,
    status: {
        type: DataTypes.ENUM('pending', 'accepted', 'rejected', 'in_progress', 'completed', 'cancelled', 'customer_completed'),
        defaultValue: 'pending'
    },
    booking_date: DataTypes.DATEONLY,
    booking_time: DataTypes.TIME,
    total_amount: {
        type: DataTypes.FLOAT,
        defaultValue: 0
    },
    payment_status: {
        type: DataTypes.ENUM('pending', 'paid', 'failed'),
        defaultValue: 'pending'
    }
}, {
    tableName: 'bookings',
    timestamps: true
});

// Mock createNotification
const createNotification = async () => {
    console.log('Notification sent');
};

// The Controller Logic (Pasted for testing)
const updateStatusBookingLogic = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            status
        } = req.body;
        const bookingData = await Booking.findByPk(req.params.id, {
            transaction: t
        });

        if (!bookingData) {
            await t.rollback();
            return {
                status: 404,
                data: {
                    message: 'Booking not found'
                }
            };
        }

        const userRole = req.user.role;
        const currentStatus = bookingData.status;

        if (status === 'cancelled' && userRole === 'customer' && currentStatus !== 'pending') {
            await t.rollback();
            return {
                status: 400,
                data: {
                    message: 'Customer may cancel the booking ONLY if status is Pending'
                }
            };
        }

        const validTransitions = {
            'pending': ['accepted', 'rejected', 'cancelled'],
            'accepted': ['in_progress', 'cancelled', 'customer_completed', 'completed'],
            'in_progress': ['customer_completed', 'completed'],
            'customer_completed': ['completed', 'rejected']
        };

        if (!validTransitions[currentStatus] || !validTransitions[currentStatus].includes(status)) {
            await t.rollback();
            return {
                status: 400,
                data: {
                    message: `Invalid status transition from ${currentStatus} to ${status}`
                }
            };
        }

        let finalStatus = status;

        if (status === 'completed' && userRole === 'customer') {
            if (currentStatus !== 'accepted' && currentStatus !== 'in_progress') {
                await t.rollback();
                return {
                    status: 400,
                    data: {
                        message: 'Booking must be in Accepted status to be marked as completed'
                    }
                };
            }

            const now = new Date();
            const scheduledDateTime = new Date(`${bookingData.booking_date}T${bookingData.booking_time}`);
            if (now < scheduledDateTime) {
                await t.rollback();
                return {
                    status: 400,
                    data: {
                        message: 'You can mark this booking as completed only after the scheduled service time.'
                    }
                };
            }

            finalStatus = 'customer_completed';
            console.log('Transitioning to customer_completed...');
        }

        if (status === 'completed' && userRole === 'provider') {
            if (currentStatus !== 'customer_completed' && currentStatus !== 'accepted' && currentStatus !== 'in_progress') {
                await t.rollback();
                return {
                    status: 400,
                    data: {
                        message: 'Invalid state for provider to confirm completion'
                    }
                };
            }

            const pointsEarned = Math.floor(bookingData.total_amount / 10) || 10;
            const customer = await User.findByPk(bookingData.customer_id, {
                transaction: t
            });
            if (customer) {
                await customer.increment('points', {
                    by: pointsEarned,
                    transaction: t
                });
            }
            bookingData.payment_status = 'paid';
        }

        await bookingData.update({
            status: finalStatus,
            payment_status: bookingData.payment_status
        }, {
            transaction: t
        });

        await t.commit();
        return {
            status: 200,
            data: bookingData.toJSON()
        };
    } catch (err) {
        if (t) await t.rollback();
        return {
            status: 500,
            data: {
                message: err.message
            }
        };
    }
};

async function runTest() {
    try {
        await sequelize.authenticate();
        console.log('Connected to DB');

        // 1. Setup Data
        const customer = await User.create({
            name: 'Test Customer',
            role: 'customer'
        });
        const provider = await User.create({
            name: 'Test Provider',
            role: 'provider'
        });

        // Yesterday's booking (should be completable)
        const b1 = await Booking.create({
            customer_id: customer.id,
            provider_id: provider.id,
            status: 'accepted',
            booking_date: '2023-01-01',
            booking_time: '12:00:00',
            total_amount: 100
        });

        // 2. Test: Customer marks completed
        console.log('--- Step 2: Customer marks completed ---');
        const res1 = await updateStatusBookingLogic({
            user: {
                role: 'customer'
            },
            params: {
                id: b1.id
            },
            body: {
                status: 'completed'
            }
        });
        console.log('Result 1 (expect customer_completed):', res1.data.status);

        // 3. Test: Provider confirms
        console.log('--- Step 3: Provider confirms ---');
        const res2 = await updateStatusBookingLogic({
            user: {
                role: 'provider'
            },
            params: {
                id: b1.id
            },
            body: {
                status: 'completed'
            }
        });
        console.log('Result 2 (expect completed and paid):', res2.data.status, res2.data.payment_status);

        // 4. Test: Points check
        const updatedCustomer = await User.findByPk(customer.id);
        console.log('Customer points (expect 10):', updatedCustomer.points);

        // Clean up
        await b1.destroy();
        await customer.destroy();
        await provider.destroy();

    } catch (e) {
        console.error('Test Failed:', e);
    } finally {
        await sequelize.close();
    }
}

runTest();