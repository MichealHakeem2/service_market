const {
    User,
    Service: ser,
    ProviderAvailability,
    Category,
    Subcategory,
    ServiceAdmin
} = require('../models/associations');
const bcrypt = require('bcryptjs');
const {
    where,
    Op
} = require('sequelize');
exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.findAll({
            attributes: {
                exclude: ['password']
            }
        });
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
exports.getUserById = async (req, res) => {
    try {
        const user = await User.findByPk(req.params.id, {
            attributes: {
                exclude: ['password']
            }
        });
        if (!user) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.getProviderById = async (req, res) => {
    try {
        const provider = await User.findByPk(req.params.id, {
            attributes: {
                exclude: ['password']
            }
        });
        if (!provider) {
            return res.status(404).json({
                message: 'Provider not found'
            });
        }
        const services = await ser.findAll({
            where: {
                userid: provider.id
            },
            include: [{
                    model: Category,
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: Subcategory,
                    attributes: ['id', 'name', 'image']
                },
                {
                    model: ServiceAdmin,
                    attributes: ['id', 'name', 'commission_type', 'commission_fee', 'price']
                },
                {
                    model: ProviderAvailability,
                    attributes: ['id', 'day_of_week', 'start_time', 'end_time', 'status']
                }
            ]
        });

        return res.status(200).json({
            provider,
            services
        });

    } catch (err) {
        return res.status(500).json({
            message: err.message
        });
    }
};
exports.updateUser = async (req, res) => {
    try {
        const userData = {
            ...req.body
        };
        if (req.file) {
            userData.image = req.file.filename;
        }
        const userUpdate = await User.update(userData, {
            where: {
                id: req.params.id
            }
        });
        if (!userUpdate) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        const userUpdateInfo = await User.findByPk(req.params.id, {
            attributes: {
                exclude: ['password']
            }
        });
        res.status(200).json(userUpdateInfo);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.updateUserPassword = async (req, res) => {
    try {
        const {
            password
        } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);

        const passwordUpdate = await User.update({
            password: hashedPassword
        }, {
            where: {
                id: req.params.id
            }
        });
        if (!passwordUpdate) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        res.status(200).json({
            message: 'Password updated successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const deleted = await User.destroy({
            where: {
                id: req.params.id
            }
        });
        if (!deleted) {
            return res.status(404).json({
                message: 'User not found'
            });
        }
        res.status(200).json({
            message: 'User deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
exports.getAllActiveProviders = async (req, res) => {
    try {
        const providers = await User.findAll({
            where: {
                role: 'provider',
                status: 'active'
            },
            attributes: {
                exclude: ['password']
            }
        });
        res.status(200).json(providers);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
exports.getActiveProviderById = async (req, res) => {
    try {
        const provider = await User.findByPk(req.params.id, {
            where: {
                role: 'provider',
                status: 'active'
            },
            attributes: {
                exclude: ['password']
            },
            include: [{
                model: ser,
                attributes: ['id', 'categoryId', 'subcategoryId', 'service_title_id', 'status', 'price', 'description', 'images'],
                include: [{
                    model: ProviderAvailability,
                    attributes: ['id', 'serviceId', 'userid', 'status', 'day_of_week', 'start_time', 'end_time'],
                    where: {
                        status: {
                            [Op.or]: ['available', 'always available']
                        }
                    }
                }]
            }]
        });
        if (!provider) {
            return res.status(404).json({
                message: 'Active provider not found'
            });
        }

        res.status(200).json({
            provider,
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};