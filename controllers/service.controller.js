const service = require('../models/Service');
const ProviderAvailability = require('../models/Provider_availabilities');
const Booking = require('../models/Bookings');
const sequelize = require('../config/db');
const User = require('../models/Users');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const ServiceAdmin = require('../models/Service_admin');
const {
    Op
} = require('sequelize');
async function validateMaxPrice(service_title_id, price_Type, price, t) {
    if (!service_title_id) return null;
    const title = await ServiceAdmin.findByPk(service_title_id, {
        transaction: t
    });
    if (!title) return 'Service title not found';
    if (title.price_Type && price_Type && title.price_Type !== price_Type) {
        return `Price type "${price_Type}" is not allowed for this service. The required type is "${title.price_Type}"`;
    }
    const maxPrice = title.price;
    if (maxPrice && price > maxPrice) {
        return `Price (${price}) exceeds the maximum allowed price (${maxPrice}) for this service`;
    }
    return null;
}
exports.getServiceAvailability = async (req, res) => {
    try {
        const {
            id
        } = req.params;
        const {
            date
        } = req.query;
        const serviceData = await service.findByPk(id);
        if (!serviceData) return res.status(404).json({
            message: 'Service not found'
        });
        const providerId = serviceData.userid;
        const targetDate = new Date(date);
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const dayName = days[targetDate.getDay()];
        const schedule = await ProviderAvailability.findOne({
            where: {
                userid: providerId,
                [Op.or]: [{
                        day_of_week: dayName
                    },
                    {
                        day_of_week: 'All Days'
                    }
                ],
                status: {
                    [Op.or]: ['available', 'always available']
                }
            }
        });
        if (!schedule) {
            return res.status(200).json({
                date,
                is_available: false,
                message: 'Provider not working on this day',
                slots: []
            });
        }
        let start = schedule.start_time || "09:00";
        let end = schedule.end_time || "17:00";

        if (schedule.status === 'always available') {
            start = "09:00";
            end = "17:00";
        }
        if (schedule.day_of_week === 'All Days') {
            start = "09:00";
            end = "17:00";
        }
        const slots = [];
        let current = parseInt(start.split(':')[0]);
        const endHour = parseInt(end.split(':')[0]);
        const bookings = await Booking.findAll({
            where: {
                provider_id: providerId,
                booking_date: date,
                status: {
                    [Op.notIn]: ['cancelled', 'rejected']
                }
            }
        });
        const bookedTimes = bookings.map(b => b.booking_time.slice(0, 5));
        while (current < endHour) {
            const timeString = `${current.toString().padStart(2, '0')}:00`;
            const isBooked = bookedTimes.includes(timeString);
            slots.push({
                time: timeString,
                available: !isBooked
            });
            current++;
        }
        res.status(200).json({
            date,
            is_available: true,
            day_of_week: dayName,
            slots
        });

    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
exports.getServiceByProviderId = async (req, res) => {
    try {

        const serviceData = await service.findAll({
            where: {
                userid: req.params.id
            },
            include: [{
                    model: Category,
                    attributes: ['name', 'image']
                },
                {
                    model: Subcategory,
                    attributes: ['name', 'image']
                },
                {
                    model: ServiceAdmin,
                    attributes: ['id', 'name', 'commission_type', 'commission_fee', 'discount', 'price']
                },
                {
                    model: User,
                    attributes: ['name', 'email', 'phone', 'image']
                },
                {
                    model: ProviderAvailability,
                    attributes: ['day_of_week', 'start_time', 'end_time', 'status']
                }
            ]
        });
        if (serviceData.length === 0) return res.status(404).json({
            message: 'Services not found'
        });
        res.status(200).json(serviceData);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getActiveServiceDetails = async (req, res) => {
    try {
        const services = await service.findAll({
            where: {
                status: 'accepted'
            },
            include: [{
                    model: Category,
                    attributes: ['name', 'image']
                },
                {
                    model: Subcategory,
                    attributes: ['name', 'image']
                },
                {
                    model: ServiceAdmin,
                    attributes: ['id', 'name', 'commission_type', 'commission_fee', 'discount', 'price']
                },
                {
                    model: User,
                    attributes: ['name', 'email', 'phone', 'image']
                },
                {
                    model: ProviderAvailability,
                    attributes: ['day_of_week', 'start_time', 'end_time', 'status']
                }
            ]
        });
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getServiceDetailsById = async (req, res) => {
    try {
        const services = await service.findAll({
            where: {
                userid: req.params.id,
            },
            include: [{
                    model: Category,
                    attributes: ['name', 'image']
                },
                {
                    model: Subcategory,
                    attributes: ['name', 'image']
                },
                {
                    model: ServiceAdmin,
                    attributes: ['id', 'name', 'commission_type', 'commission_fee', 'discount', 'price']
                },
                {
                    model: User,
                    attributes: ['name', 'email', 'phone', 'image']
                },
                {
                    model: ProviderAvailability,
                    attributes: ['day_of_week', 'start_time', 'end_time', 'status']
                }
            ]
        });
        if (!services) {
            return res.status(404).json({
                message: 'Active service not found'
            });
        }
        res.status(200).json(services);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.createService = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            price,
            categoryId
        } = req.body;

        const {
            service_title_id,
            price_Type
        } = req.body;
        const priceValidationError = await validateMaxPrice(service_title_id, price_Type, price, t);
        if (priceValidationError) {
            await t.rollback();
            return res.status(400).json({
                message: priceValidationError
            });
        }
        const serviceTitle = service_title_id ? await ServiceAdmin.findByPk(service_title_id, {
            transaction: t
        }) : null;
        const {
            max_price: _,
            commission_type: __ct,
            commission_fee: __cf,
            discount: __d,
            ...filteredBody
        } = req.body;
        const serviceData = {
            ...filteredBody,
            max_price: serviceTitle ? serviceTitle.price : 0,
            commission_type: serviceTitle ? serviceTitle.commission_type : 'Percentage',
            commission_fee: serviceTitle ? serviceTitle.commission_fee : 0
        };

        if (req.files) {
            if (req.files['image'] && req.files['image'][0]) {
                serviceData.images = req.files['image'][0].filename;
            }
            if (req.files['gallery']) {
                serviceData.gallery = req.files['gallery'].map(f => f.filename);
            }
            if (req.files['images[]']) {
                serviceData.gallery = req.files['images[]'].map(f => f.filename);
                if (!serviceData.images && serviceData.gallery.length > 0) {
                    serviceData.images = serviceData.gallery[0];
                }
            }
        } else if (req.file) {
            serviceData.images = req.file.filename;
        }

        const newService = await service.create({
            ...serviceData,
            status: 'pending',
            userid: req.user ? req.user.id : req.body.userid
        }, {
            transaction: t
        });
        await t.commit();
        res.status(201).json(newService);
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({
            message: err.message
        });
    }
}
exports.createServiceAndAvailability = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const {
            availability_status,
            day_of_week,
            start_time,
            end_time,
            price,
            images,
            state,
            categoryId,
            ...rest
        } = req.body;
        const userId = req.user ? req.user.id : req.body.userid;

        if (availability_status !== 'always available' && start_time && end_time && start_time >= end_time) {
            await t.rollback();
            return res.status(400).json({
                message: 'Start time must be earlier than end time'
            });
        }
        const {
            service_title_id,
            price_Type
        } = rest;
        const priceValidationError = await validateMaxPrice(service_title_id, price_Type, price, t);
        if (priceValidationError) {
            await t.rollback();
            return res.status(400).json({
                message: priceValidationError
            });
        }
        const serviceTitle = service_title_id ? await ServiceAdmin.findByPk(service_title_id, {
            transaction: t
        }) : null;
        const {
            max_price: _,
            commission_type: __ct,
            commission_fee: __cf,
            discount: __d,
            ...filteredRest
        } = rest;
        const serviceData = {
            ...filteredRest,
            categoryId,
            price,
            images,
            state,
            max_price: serviceTitle ? serviceTitle.price : 0,
            commission_type: serviceTitle ? serviceTitle.commission_type : 'Percentage',
            commission_fee: serviceTitle ? serviceTitle.commission_fee : 0
        };
        let userImage = images;
        let galleryImages = [];

        if (req.files) {
            if (req.files['image'] && req.files['image'][0]) {
                userImage = req.files['image'][0].filename;
            }
            if (req.files['gallery']) {
                galleryImages = req.files['gallery'].map(f => f.filename);
            }
            if (!userImage && galleryImages.length > 0) {
                userImage = galleryImages[0];
            }
        } else if (req.file) {
            userImage = req.file.filename;
        }

        const newService = await service.create({
            ...serviceData,
            images: userImage,
            gallery: galleryImages.length > 0 ? galleryImages : null,
            status: 'pending',
            userid: userId
        }, {
            transaction: t
        });
        const availability = await ProviderAvailability.create({
            serviceId: newService.id,
            userid: userId,
            day_of_week: day_of_week,
            start_time: start_time,
            end_time: end_time,
            status: availability_status || 'available',
            holiday: req.body.holiday || 'not holiday'
        }, {
            transaction: t
        });

        await t.commit();

        res.status(201).json({
            service: newService,
            availability
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
}
exports.updateService = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const serviceData = await service.findByPk(req.params.id, {
            transaction: t
        });
        if (!serviceData) {
            await t.rollback();
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        const {
            price,
            images,
            categoryId,
            ...restBody
        } = req.body;
        const newPrice = price || serviceData.price;
        const titleId = restBody.service_title_id || serviceData.service_title_id;
        const priceType = restBody.price_Type || serviceData.price_Type;
        const priceValidationError = await validateMaxPrice(titleId, priceType, newPrice, t);
        if (priceValidationError) {
            await t.rollback();
            return res.status(400).json({
                message: priceValidationError
            });
        }
        const serviceTitle = titleId ? await ServiceAdmin.findByPk(titleId, {
            transaction: t
        }) : null;
        let userImage = images || serviceData.images;
        let galleryImages = serviceData.gallery || [];

        if (req.files) {
            if (req.files['image'] && req.files['image'][0]) {
                userImage = req.files['image'][0].filename;
            }
            if (req.files['gallery']) {
                galleryImages = req.files['gallery'].map(f => f.filename);
            }
        } else if (req.file) {
            userImage = req.file.filename;
        }

        const {
            max_price: _,
            commission_type: __ct,
            commission_fee: __cf,
            discount: __d,
            ...filteredRest
        } = restBody;
        const updateData = {
            ...filteredRest,
            price: newPrice,
            categoryId: categoryId || serviceData.categoryId,
            max_price: serviceTitle ? serviceTitle.price : serviceData.max_price,
            commission_type: serviceTitle ? serviceTitle.commission_type : serviceData.commission_type,
            commission_fee: serviceTitle ? serviceTitle.commission_fee : serviceData.commission_fee,
            images: userImage,
            gallery: galleryImages.length > 0 ? galleryImages : serviceData.gallery
        };

        const priceChanged = price && price !== serviceData.price;
        await serviceData.update(updateData, {
            transaction: t
        });
        await t.commit();
        res.status(200).json({
            service: serviceData,
            message: priceChanged ? "Existing and ongoing bookings will continue at the old price. New price applies to new bookings only." : undefined
        });
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({
            message: err.message
        });
    }
}
exports.deleteService = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const serviceData = await service.findByPk(req.params.id, {
            transaction: t
        });
        if (!serviceData) {
            await t.rollback();
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        const activeBookings = await Booking.count({
            where: {
                service_id: req.params.id,
                status: {
                    [Op.in]: ['pending', 'accepted', 'in_progress']
                }
            },
            transaction: t
        });
        if (activeBookings > 0) {
            await t.rollback();
            return res.status(400).json({
                message: `Cannot delete service with ${activeBookings} active/pending bookings. Set it to 'offline' instead.`
            });
        }
        await serviceData.destroy({
            transaction: t
        });
        await t.commit();
        res.status(200).json({
            message: 'Service deleted successfully'
        });
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getAllServiceGallery = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '..', 'uploads');

        const services = await service.findAll({
            attributes: ['id', 'images', 'gallery', 'userid']
        });
        const allImages = [];
        const imageSet = new Set();
        services.forEach(svc => {
            const cover = svc.images;
            const gallery = svc.gallery;
            let imageArray = [];

            if (cover) imageArray.push(cover);

            if (Array.isArray(gallery)) {
                imageArray = imageArray.concat(gallery);
            }

            imageArray.forEach(img => {
                if (img && !imageSet.has(img)) {
                    const imagePath = path.join(uploadsDir, img);
                    if (fs.existsSync(imagePath)) {
                        imageSet.add(img);
                        allImages.push({
                            image: img,
                            service_id: svc.id,
                            provider_id: svc.userid
                        });
                    }
                }
            });
        });

        res.status(200).json({
            total_images: allImages.length,
            images: allImages
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getServiceGalleryById = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '..', 'uploads');

        const services = await service.findAll({
            where: {
                userid: req.params.id
            },
            attributes: ['id', 'images', 'userid']
        });
        const user = await User.findByPk(req.params.id);
        const allImages = [];
        const imageSet = new Set();
        services.forEach(svc => {
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
                if (img && !imageSet.has(img)) {
                    const imagePath = path.join(uploadsDir, img);
                    if (fs.existsSync(imagePath)) {
                        imageSet.add(img);
                        allImages.push({
                            image: img,
                            service_id: svc.id,
                            provider_id: svc.userid
                        });
                    }
                }
            });
        });

        res.status(200).json({
            total_images: allImages.length,
            images: allImages
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}