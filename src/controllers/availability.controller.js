const ProviderAvailability = require('../models/Provider_availabilities');
const sequelize = require('../config/db');
exports.getAllAvailability = async (req, res) => {
    try {
        const availability = await ProviderAvailability.findAll();
        res.status(200).json({
            message: 'Availability fetched successfully',
            availability
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.createNewAvailability = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            day_of_week,
            status,
            start_time,
            end_time
        } = req.body;
        if (status !== 'always available' && start_time && end_time && start_time >= end_time) {
            return res.status(400).json({
                message: 'Start time must be earlier than end time'
            });
        }
        let availability = await ProviderAvailability.findOne({
            where: {
                userid: userId,
                day_of_week
            }
        });
        availability = await ProviderAvailability.create({
            userid: userId,
            day_of_week,
            status,
            start_time: status === 'always available' ? '00:00' : start_time,
            end_time: status === 'always available' ? '24:00' : end_time
        });
        res.status(200).json({
            message: 'Availability updated successfully',
            availability
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}

exports.updateAvailability = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            day_of_week,
            status,
            start_time,
            end_time
        } = req.body;
        if (status !== 'always available' && start_time && end_time && start_time >= end_time) {
            return res.status(400).json({
                message: 'Start time must be earlier than end time'
            });
        }
        let availability = await ProviderAvailability.findOne({
            where: {
                userid: userId,
                day_of_week
            }
        });
        if (availability) {
            await availability.update({
                status,
                start_time: status === 'always available' ? '00:00' : start_time,
                end_time: status === 'always available' ? '24:00' : end_time
            });
        } else {
            availability = await ProviderAvailability.create({
                userid: userId,
                day_of_week,
                status,
                start_time: status === 'always available' ? '00:00' : start_time,
                end_time: status === 'always available' ? '24:00' : end_time
            });
        }

        res.status(200).json({
            message: 'Availability updated successfully',
            availability
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.setAlwaysAvailable = async (req, res) => {
    try {
        const userId = req.user.id;
        const {
            serviceId
        } = req.body;
        if (!serviceId) {
            return res.status(400).json({
                message: 'Service ID is required'
            });
        }

        const targetDay = 'All Days';

        let availability = await ProviderAvailability.findOne({
            where: {
                userid: userId,
                day_of_week: targetDay,
                serviceId: serviceId
            }
        });

        if (availability) {
            await availability.update({
                status: 'always available',
                start_time: '09:00',
                end_time: '17:00'
            });
        } else {
            availability = await ProviderAvailability.create({
                userid: userId,
                serviceId: serviceId,
                day_of_week: targetDay,
                status: 'always available',
                start_time: '09:00',
                end_time: '17:00'
            });
        }

        res.status(200).json({
            message: `Availability set to 'always available' for ${targetDay}`,
            availability
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}