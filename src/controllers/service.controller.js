const service = require('../models/Service');
const ProviderAvailability = require('../models/Provider_availabilities');
const Booking = require('../models/Bookings');
const sequelize = require('../config/db');
const User = require('../models/Users');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const Service_title = require('../models/Service_title');
const {
    Op
} = require('sequelize');
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
                    model: Service_title,
                    attributes: ['name']
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
                    attributes: ['name', 'image', 'commission_fee', 'max_price']
                },
                {
                    model: Subcategory,
                    attributes: ['name', 'image']
                },
                {
                    model: Service_title,
                    attributes: ['name']
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
                    attributes: ['name', 'image', 'commission_fee', 'max_price']
                },
                {
                    model: Subcategory,
                    attributes: ['name', 'image']
                },
                {
                    model: Service_title,
                    attributes: ['name']
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
    try {
        const {
            price,
            categoryId
        } = req.body;

        const category = await Category.findByPk(categoryId);
        if (!category) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }

        if (price && category.max_price && price > category.max_price) {
            return res.status(400).json({
                message: `Price (${price}) exceeds maximum allowed price (${category.max_price}) for this category`
            });
        }
        const {
            max_price: _,
            commission_fee: __,
            ...filteredBody
        } = req.body;
        const serviceData = {
            ...filteredBody,
            max_price: category.max_price || 0,
            commission_fee: category.commission_fee || 0
        };

        if (req.files) {
            if (req.files['image'] && req.files['image'][0]) {
                serviceData.image = req.files['image'][0].filename;
            }
            if (req.files['images[]']) {
                serviceData.images = req.files['images[]'].map(f => f.filename);
            }
        } else if (req.file) {
            serviceData.image = req.file.filename;
        }

        const newService = await service.create({
            ...serviceData,
            status: 'pending',
            userid: req.user ? req.user.id : req.body.userid
        });
        res.status(201).json(newService);
    } catch (err) {
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

        const category = await Category.findByPk(categoryId, {
            transaction: t
        });
        if (!category) {
            await t.rollback();
            return res.status(404).json({
                message: 'Category not found'
            });
        }

        if (price && category.max_price && price > category.max_price) {
            await t.rollback();
            return res.status(400).json({
                message: `Price (${price}) exceeds maximum allowed price (${category.max_price}) for this category`
            });
        }
        if (availability_status !== 'always available' && start_time && end_time && start_time >= end_time) {
            await t.rollback();
            return res.status(400).json({
                message: 'Start time must be earlier than end time'
            });
        }
        const {
            max_price: _,
            commission_fee: __,
            ...filteredRest
        } = rest;
        const serviceData = {
            ...filteredRest,
            categoryId,
            price,
            images,
            state,
            max_price: category.max_price || 0,
            commission_fee: category.commission_fee || 0
        };
        let userImage = images;
        if (req.file) {
            userImage = req.file.filename;
        }

        const newService = await service.create({
            ...serviceData,
            images: userImage,
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
    try {
        const serviceData = await service.findByPk(req.params.id);
        if (!serviceData) return res.status(404).json({
            message: 'Service not found'
        });
        const {
            price,
            images,
            categoryId,
            ...restBody
        } = req.body;

        let categoryToUse = null;
        if (categoryId) {
            categoryToUse = await Category.findByPk(categoryId);
        } else {
            categoryToUse = await Category.findByPk(serviceData.categoryId);
        }

        if (!categoryToUse) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }

        const currentMaxPrice = categoryToUse.max_price || 0;
        const newPrice = price || serviceData.price;
        if (newPrice > currentMaxPrice) {
            return res.status(400).json({
                message: `Price (${newPrice}) exceeds maximum allowed price (${currentMaxPrice}) for this category`
            });
        }
        let userImage = images;
        if (req.file) {
            userImage = req.file.filename;
        }
        const {
            max_price: _,
            commission_fee: __,
            ...filteredRest
        } = restBody;
        const updateData = {
            ...filteredRest,
            price: newPrice,
            categoryId: categoryId || serviceData.categoryId,
            max_price: categoryToUse.max_price || 0,
            commission_fee: categoryToUse.commission_fee || 0,
            images: userImage
        };

        const priceChanged = price && price !== serviceData.price;
        await serviceData.update(updateData);
        res.status(200).json({
            service: serviceData,
            message: priceChanged ? "Existing and ongoing bookings will continue at the old price. New price applies to new bookings only." : undefined
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.deleteService = async (req, res) => {
    try {
        const serviceData = await service.findByPk(req.params.id);
        if (!serviceData) return res.status(404).json({
            message: 'Service not found'
        });
        const activeBookings = await Booking.count({
            where: {
                service_id: req.params.id,
                status: {
                    [Op.in]: ['pending', 'accepted', 'in_progress']
                }
            }
        });
        if (activeBookings > 0) {
            return res.status(400).json({
                message: `Cannot delete service with ${activeBookings} active/pending bookings. Set it to 'offline' instead.`
            });
        }
        await serviceData.destroy();
        res.status(200).json({
            message: 'Service deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getAllServiceGallery = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

        const services = await service.findAll({
            attributes: ['id', 'images', 'userid']
        });
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
exports.getServiceGalleryById = async (req, res) => {
    try {
        const fs = require('fs');
        const path = require('path');
        const uploadsDir = path.join(__dirname, '..', '..', 'uploads');

        const services = await service.findAll({
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