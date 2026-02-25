const User = require('../models/Users');
const Service = require('../models/Service');
const Booking = require('../models/Bookings');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Service_title = require('../models/Service_title');
const {
    Op
} = require('sequelize');

exports.getAllProviders = async (req, res) => {
    try {
        const {
            status
        } = req.query;
        const whereClause = {
            role: 'provider'
        };
        if (status) {
            whereClause.status = status;
        }
        const providers = await User.findAll({
            where: whereClause,
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

exports.getPendingProviders = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

        const serv = await Service.findAll({
            attributes: ['id', 'images', 'userid']
        });

        const allImages = [];

        serv.forEach(svc => {
            const imgs = svc.images;
            let imageArray = [];

            if (!imgs) {
                imageArray = [];
            } else if (typeof imgs === 'string') {
                try {
                    const parsed = JSON.parse(imgs);
                    imageArray = Array.isArray(parsed) ? parsed : [parsed];
                } catch (e) {
                    imageArray = [imgs];
                }
            } else if (Array.isArray(imgs)) {
                imageArray = imgs;
            }

            if (!Array.isArray(imageArray)) {
                imageArray = [];
            }

            imageArray.forEach(img => {
                if (img) {
                    const imagePath = path.join(uploadsDir, img);
                    if (fs.existsSync(imagePath)) {
                        allImages.push({
                            serviceImage: img,
                            service_id: svc.id,
                            provider_id: svc.userid
                        });
                    }
                }
            });
        });

        const providers = await User.findAll({
            where: {
                role: 'provider',
                status: 'pending'
            },
            attributes: {
                exclude: ['password']
            },
            include: [{
                model: Service,
                include: [
                    {
                        model: Category,
                        attributes: ['id', 'name']
                    },
                    {
                        model: Subcategory,
                        attributes: ['id', 'name']
                    },
                    {
                        model: Service_title,
                        attributes: ['id', 'name']
                    }
                ]
            }]
        });

        const providersWithImages = providers.map(provider => {
            const providerData = provider.toJSON();
            providerData.serviceImages = allImages.filter(img =>
                img.provider_id === provider.id
            );
            providerData.total_images = providerData.serviceImages.length;
            return providerData;
        });
        res.status(200).json(providersWithImages);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

const {
    createNotification
} = require('./notification.controller');
const sequelize = require('../config/db');
exports.approveProvider = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const user = await User.findByPk(req.params.id, {
            transaction: t
        });
        if (!user || user.role !== 'provider') {
            await t.rollback();
            return res.status(404).json({
                message: 'Provider not found'
            });
        }
        user.status = 'active';
        user.approvedAt = new Date();
        user.approvedBy = req.user.id;
        await user.save({
            transaction: t
        });

        const updatedUser = await User.findByPk(req.params.id, {
            attributes: {
                exclude: ['password']
            },
            transaction: t
        });
        await createNotification(
            user.id,
            'system',
            'Your provider account has been approved! You can now access the provider portal.',
            user.id,
            'user', {
                transaction: t
            }
        );
        await t.commit();
        res.status(200).json({
            message: 'Provider approved successfully',
            user: updatedUser
        });
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
};

exports.rejectProvider = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const user = await User.findByPk(req.params.id, {
            transaction: t
        });
        if (!user || user.role !== 'provider') {
            await t.rollback();
            return res.status(404).json({
                message: 'Provider not found'
            });
        }
        user.status = 'rejected';
        await user.save({
            transaction: t
        });

        const updatedUser = await User.findByPk(req.params.id, {
            attributes: {
                exclude: ['password']
            },
            transaction: t
        });
        await createNotification(
            user.id,
            'system',
            'Your provider account application has been rejected.',
            user.id,
            'user', {
                transaction: t
            }
        );
        await Service.update({
            status: 'rejected'
        }, {
            where: {
                userid: user.id
            },
            transaction: t
        });
        await Booking.update({
            status: 'cancelled'
        }, {
            where: {
                provider_id: user.id,
                status: {
                    [Op.in]: ['pending', 'accepted', 'in_progress']
                }
            },
            transaction: t
        });

        await t.commit();
        res.status(200).json({
            message: 'Provider rejected successfully',
            user: updatedUser
        });
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
};
exports.getAllCustomers = async (req, res) => {
    try {
        const {
            search
        } = req.query;
        const whereClause = {
            role: 'customer'
        };

        if (search) {
            whereClause[Op.or] = [{
                    name: {
                        [Op.like]: `%${search}%`
                    }
                },
                {
                    email: {
                        [Op.like]: `%${search}%`
                    }
                }
            ];
        }

        const customers = await User.findAll({
            where: whereClause,
            attributes: {
                exclude: ['password']
            }
        });
        res.status(200).json(customers);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.userChangeStatus = async (req, res) => {
    try {
        const {
            status
        } = req.body;
        const userUpdate = await User.update({
            status
        }, {
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

exports.getPendingServices = async (req, res) => {
    try {
        const services = await Service.findAll({
            where: {
                status: 'pending'
            },
            include: [{
                    model: User,
                    attributes: ['id', 'name', 'email', 'createdAt']
                },
                {
                    model: Category,
                    attributes: ['id', 'name']
                },
                {
                    model: Subcategory,
                    attributes: ['id', 'name']
                },
                {
                    model: Service_title,
                    attributes: ['id', 'name']
                }
            ]
        });
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.approveService = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const service = await Service.findByPk(req.params.id, {
            transaction: t
        });
        if (!service) {
            await t.rollback();
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        service.status = 'accepted';
        service.approvedAt = new Date();
        service.approvedBy = req.user.id;
        await service.save({
            transaction: t
        });

        await createNotification(
            service.userid,
            'system',
            `Your service "${service.service_title_id}" has been approved!`,
            service.userid,
            'user', {
                transaction: t
            }
        );

        await t.commit();
        res.status(200).json({
            message: 'Service approved successfully',
            service
        });
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
};
exports.activeTheService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        service.state = 'active';
        await service.save();
        res.status(200).json({
            message: 'Service activated successfully',
            service
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
exports.rejectService = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const service = await Service.findByPk(req.params.id, {
            transaction: t
        });
        if (!service) {
            await t.rollback();
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        const {
            rejectionReason
        } = req.body;
        service.status = 'rejected';
        service.rejectionReason = rejectionReason;
        await service.save({
            transaction: t
        });

        await createNotification(
            service.userid,
            'system',
            `Your service "${service.service_title_id}" has been rejected.`,
            service.userid,
            'user', {
                transaction: t
            }
        );
        await Booking.update({
            status: 'cancelled'
        }, {
            where: {
                service_id: service.id,
                status: {
                    [Op.in]: ['pending', 'accepted', 'in_progress']
                }
            },
            transaction: t
        });

        await t.commit();
        res.status(200).json({
            message: 'Service rejected successfully',
            service
        });
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
};
exports.deactiveTheService = async (req, res) => {
    try {
        const service = await Service.findByPk(req.params.id);
        if (!service) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        service.state = 'inactive';
        await service.save();
        res.status(200).json({
            message: 'Service deactivated successfully',
            service
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
exports.getAllServicesAdmin = async (req, res) => {
    try {
        const {
            status
        } = req.query;
        const whereClause = {};
        if (status) {
            whereClause.status = status;
        }
        const services = await Service.findAll({
            where: whereClause,
            include: [{
                model: User,
                attributes: ['id', 'name', 'email']
            }]
        });
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};