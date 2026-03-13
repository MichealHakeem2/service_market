const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/Users');
const Token = require('../models/Token');
const RolePortalAccess = require('../models/RolePortalAccess');
const category = require('../models/Category');
const sequelize = require('../config/db');
const {
    Op
} = require('sequelize');
const ser = require('../models/Service');
const pa = require('../models/Provider_availabilities');
const ServiceAdmin = require('../models/Service_admin');
const generateToken = (user) => {
    return jwt.sign({
            id: user.id,
            role: user.role
        },
        process.env.JWT_SECRET, {
            expiresIn: '1h'
        }
    );
};
exports.userRegister = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            name,
            password,
            email,
            phone,
            address,
            city,
            image,
            role
        } = req.body;

        const existingUser = await User.findOne({
            where: {
                email
            },
            transaction: t
        });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({
                message: 'User already exists'
            });
        }

        const hashedPassword = await bcrypt.hash(password, 10);
        let userImage = image;
        if (req.file) {
            userImage = req.file.filename;
        }

        const newUser = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            city,
            image: userImage,
            role: role || 'customer',
            status: 'active'
        }, {
            transaction: t
        });

        const token = generateToken(newUser);

        await Token.create({
            token,
            user_id: newUser.id,
            status: 'active'
        }, {
            transaction: t
        });

        await t.commit();

        return res.status(201).json({
            id: newUser.id,
            name: newUser.name,
            email: newUser.email,
            phone: newUser.phone,
            address: newUser.address,
            city: newUser.city,
            role: newUser.role,
            status: newUser.status,
            message: `${newUser.role} registered successfully`
        });

    } catch (err) {
        if (t) {
            try {
                await t.rollback();
            } catch (rollbackErr) {
                console.error('Secondary error during rollback:', rollbackErr.message);
            }
        }
        return res.status(500).json({
            message: err.message
        });
    }
};
exports.providerRegister = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            name,
            password,
            email,
            phone,
            address,
            city,
            image,
            categoryId,
            subcategoryId,
            service_title_id,
            price_Type,
            price,
            day_of_week,
            start_time,
            end_time,
            availabilityStatus,
            description,
            images,
            availabilities,
            services
        } = req.body;

        if (availabilityStatus !== 'always available' && start_time && end_time && start_time >= end_time) {
            await t.rollback();
            return res.status(400).json({
                message: 'Start time must be earlier than end time'
            });
        }

        let parsedServices = services;
        if (typeof parsedServices === 'string') {
            try {
                parsedServices = JSON.parse(parsedServices);
            } catch (e) {
                parsedServices = null;
            }
        }

        let servicesDataToCreate = [];
        if (Array.isArray(parsedServices) && parsedServices.length > 0) {
            for (const s of parsedServices) {
                const titleId = s.service_title_id || service_title_id;
                const adminTitle = await ServiceAdmin.findByPk(titleId, {
                    transaction: t
                });
                if (!adminTitle) {
                    await t.rollback();
                    return res.status(404).json({
                        message: `Service blueprint not found for ID: ${titleId}`
                    });
                }
                const sPrice = s.price || price;
                const price_T = s.price_Type || price_Type;
                const maxPrice = adminTitle.price;
                if (adminTitle.price_Type && price_T && adminTitle.price_Type !== price_T) {
                    await t.rollback();
                    return res.status(400).json({
                        message: `Price type "${price_T}" is not allowed. This service requires "${adminTitle.price_Type}" pricing`
                    });
                }

                if (maxPrice && sPrice > maxPrice) {
                    await t.rollback();
                    return res.status(400).json({
                        message: `Price (${sPrice}) exceeds maximum allowed price (${maxPrice}) for this service`
                    });
                }
                servicesDataToCreate.push({
                    categoryId: s.categoryId || categoryId,
                    subcategoryId: s.subcategoryId || subcategoryId,
                    service_title_id: titleId,
                    price_Type: price_T,
                    price: sPrice,
                    description: s.description || description,
                    max_price: adminTitle.price || 0,
                    commission_type: adminTitle.commission_type,
                    commission_fee: adminTitle.commission_fee || 0
                });
            }
        } else if (service_title_id) {
            const adminTitle = await ServiceAdmin.findByPk(service_title_id, {
                transaction: t
            });
            if (!adminTitle) {
                await t.rollback();
                return res.status(404).json({
                    message: 'Service blueprint not found'
                });
            }
            const maxPrice = adminTitle.price;
            if (adminTitle.price_Type && price_Type && adminTitle.price_Type !== price_Type) {
                await t.rollback();
                return res.status(400).json({
                    message: `Price type "${price_Type}" is not allowed. This service requires "${adminTitle.price_Type}" pricing`
                });
            }
            if (price && maxPrice && price > maxPrice) {
                await t.rollback();
                return res.status(400).json({
                    message: `Price (${price}) exceeds maximum allowed price (${maxPrice}) for this service`
                });
            }
            servicesDataToCreate.push({
                categoryId: categoryId,
                subcategoryId: subcategoryId,
                service_title_id: service_title_id,
                price_Type: price_Type,
                price: price,
                description: description,
                max_price: adminTitle.price || 0,
                commission_type: adminTitle.commission_type,
                commission_fee: adminTitle.commission_fee || 0
            });
        }

        const existingUser = await User.findOne({
            where: {
                email
            },
            transaction: t
        });
        if (existingUser) {
            await t.rollback();
            return res.status(400).json({
                message: 'User already exists'
            });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        let userImage = image;
        if (req.files && req.files['image'] && req.files['image'][0]) {
            userImage = req.files['image'][0].filename;
        } else if (req.file) {
            userImage = req.file.filename;
        }

        const user = await User.create({
            name,
            email,
            password: hashedPassword,
            phone,
            address,
            city,
            image: userImage,
            description,
            status: 'pending',
            role: 'provider'
        }, {
            transaction: t
        });
        let userImagess = images;
        let galleryImages = [];

        if (req.files) {
            if (req.files['gallery']) {
                galleryImages = req.files['gallery'].map(f => f.filename);
            }
            if (!userImagess && galleryImages.length > 0) {
                userImagess = galleryImages[0];
            }
        } else if (req.file) {
            userImagess = req.file.filename;
        }

        let createdServices = [];
        let createdAvailabilities = [];

        if (servicesDataToCreate.length > 0) {
            for (const sData of servicesDataToCreate) {
                if (!sData.categoryId) continue;

                const service = await ser.create({
                    userid: user.id,
                    categoryId: sData.categoryId,
                    subcategoryId: sData.subcategoryId,
                    service_title_id: sData.service_title_id,
                    price_Type: sData.price_Type,
                    price: sData.price,
                    description: sData.description,
                    images: userImagess,
                    gallery: galleryImages.length > 0 ? galleryImages : null,
                    max_price: sData.max_price,
                    commission_type: sData.commission_type,
                    commission_fee: sData.commission_fee
                }, {
                    transaction: t
                });
                createdServices.push(service);

                let providerAvailability;
                if (availabilityStatus === 'always available') {
                    providerAvailability = await pa.create({
                        userid: user.id,
                        serviceId: service.id,
                        day_of_week: 'All Days',
                        start_time: '09:00',
                        end_time: '17:00',
                        status: 'always available'
                    }, {
                        transaction: t
                    });
                    createdAvailabilities.push(providerAvailability);
                } else {
                    let parsedAvailabilities = availabilities;
                    if (typeof parsedAvailabilities === 'string') {
                        try {
                            parsedAvailabilities = JSON.parse(parsedAvailabilities);
                        } catch (e) {
                            parsedAvailabilities = null;
                        }
                    }
                    if (Array.isArray(parsedAvailabilities) && parsedAvailabilities.length > 0) {
                        for (const slot of parsedAvailabilities) {
                            let paRecord = await pa.create({
                                userid: user.id,
                                serviceId: service.id,
                                day_of_week: slot.day_of_week,
                                start_time: slot.start_time,
                                end_time: slot.end_time,
                                status: 'available'
                            }, {
                                transaction: t
                            });
                            createdAvailabilities.push(paRecord);
                        }
                    } else if (day_of_week && start_time) {
                        // Only create if we have basic availability info
                        let paRecord = await pa.create({
                            userid: user.id,
                            serviceId: service.id,
                            day_of_week,
                            start_time,
                            end_time,
                            status: 'available'
                        }, {
                            transaction: t
                        });
                        createdAvailabilities.push(paRecord);
                    }
                }
            }
        }

        await t.commit();

        const firstService = createdServices.length > 0 ? createdServices[0] : {};
        const firstAvailability = createdAvailabilities.length > 0 ? createdAvailabilities[0] : {};

        res.status(201).json({
            id: user.id,
            name: user.name,
            email: user.email,
            phone: user.phone,
            address: user.address,
            city: user.city,
            role: user.role,
            categoryId: firstService.categoryId || null,
            subcategoryId: firstService.subcategoryId || null,
            service_title_id: firstService.service_title_id || null,
            price_Type: firstService.price_Type || null,
            price: firstService.price || null,
            max_price: firstService.max_price || null,
            commission_fee: firstService.commission_fee || null,
            day_of_week: firstAvailability.day_of_week || null,
            start_time: firstAvailability.start_time || null,
            end_time: firstAvailability.end_time || null,
            services: createdServices,
            status: user.status,
            message: `${user.role} registered successfully`
        });

    } catch (err) {
        if (t) {
            try {
                await t.rollback();
            } catch (rollbackErr) {
                console.error('Secondary error during rollback:', rollbackErr.message);
            }
        }
        if (err.name === 'SequelizeValidationError' || err.name === 'SequelizeUniqueConstraintError') {
            return res.status(400).json({
                message: 'Validation failed',
                errors: err.errors.map(e => ({
                    path: e.path,
                    msg: e.message
                }))
            });
        }
        res.status(500).json({
            message: err.message
        });
    }
};
exports.login = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            email,
            password
        } = req.body;

        const data = await User.findOne({
            where: {
                email
            },
            transaction: t
        });

        if (!data) {
            await t.rollback();
            return res.status(404).json({
                message: "User not found"
            });
        }
        if (data.status !== "active") {
            await t.rollback();
            return res.status(403).json({
                message: "User is not allowed to login"
            });
        }

        const portalAccess = await RolePortalAccess.findOne({
            where: {
                role: data.role,
                portalType: {
                    [Op.in]: ['CustomerPortal', 'ProviderPortal']
                }
            },
            transaction: t
        });

        if (!portalAccess) {
            await t.rollback();
            return res.status(403).json({
                message: `User with role '${data.role}' is not allowed to login through this portal`
            });
        }
        const bcryptRegex = /^\$2[aby]\$.{56}$/;
        const isMatch = bcryptRegex.test(data.password) ?
            await bcrypt.compare(password, data.password) :
            password === data.password;

        if (!isMatch) {
            await t.rollback();
            return res.status(401).json({
                message: "Invalid password"
            });
        }

        const token = generateToken(data);
        await Token.create({
            token,
            user_id: data.id,
            status: 'active'
        }, {
            transaction: t
        });

        await t.commit();

        return res.status(200).json({
            id: data.id,
            username: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            role_name: data.role,
            token,
            message: `${data.role} Login successful`
        });

    } catch (err) {
        if (t) {
            try {
                await t.rollback();
            } catch (rollbackErr) {
                console.error('Secondary error during rollback:', rollbackErr.message);
            }
        }
        return res.status(500).json({
            message: err.message
        });
    }
};

exports.adminLogin = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            email,
            password
        } = req.body
        const data = await User.findOne({
            where: {
                email
            },
            transaction: t
        });
        if (!data) {
            await t.rollback();
            return res.status(404).json({
                message: "User not found"
            })
        }
        if (data.status !== "active") {
            await t.rollback();
            return res.status(403).json({
                message: "User is not allowed to login"
            });
        }
        const portalAccess = await RolePortalAccess.findOne({
            where: {
                role: data.role,
                portalType: 'AdminPortal'
            },
            transaction: t
        });

        if (!portalAccess) {
            await t.rollback();
            return res.status(403).json({
                message: `User with role '${data.role}' is not allowed to login to Admin portal`
            });
        }

        const bcryptRegex = /^\$2[aby]\$.{56}$/;
        const isMatch = bcryptRegex.test(data.password) ? await bcrypt.compare(password, data.password) : password === data.password;
        if (!isMatch) {
            await t.rollback();
            return res.status(401).json({
                message: "Invalid password"
            });
        }
        const token = generateToken(data)
        await Token.create({
            token,
            user_id: data.id,
            status: 'active'
        }, {
            transaction: t
        })

        await t.commit();

        res.status(200).json({
            id: data.id,
            username: data.name,
            email: data.email,
            phone: data.phone,
            address: data.address,
            city: data.city,
            role_name: data.role,
            token,
            message: `${data.role} login successful`
        })
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
        })
    }
}
exports.logout = async (req, res) => {
    try {

        const [updated] = await Token.update({
            status: "deleted"
        }, {
            where: {
                token: req.token,
                user_id: req.user.id,
                status: "active"
            }
        });

        if (!updated) {
            return res.status(401).json({
                success: false,
                message: "Token already invalid"
            });
        }

        res.status(200).json({
            success: true,
            message: "Logout successful"
        });

    } catch (err) {
        res.status(500).json({
            success: false,
            message: err.message
        });
    }
};
exports.logoutAll = async (req, res) => {
    await Token.update({
        status: "deleted"
    }, {
        where: {
            user_id: req.user.id,
            status: "active"
        }
    });

    res.json({
        message: "Logged out everywhere"
    });
};