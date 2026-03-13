const ServiceAdmin = require('../models/Service_admin');
const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const {
    Op
} = require('sequelize');

exports.getAllAdminServices = async (req, res) => {
    try {
        const services = await ServiceAdmin.findAll({
            include: [{
                    model: Category,
                    attributes: ['id', 'name']
                },
                {
                    model: Subcategory,
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

exports.getAdminServiceById = async (req, res) => {
    try {
        const service = await ServiceAdmin.findByPk(req.params.id);
        if (!service) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        res.status(200).json(service);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.createAdminService = async (req, res) => {
    try {
        const userRole = req.user && req.user.role;
        const {
            name,
            categoryId,
            subcategory_id,
            description,
            price,
            commission_type,
            commission_fee,
            discount,
            price_Type,
            status
        } = req.body;

        // Validation: Must have category and subcategory
        if (!categoryId || !subcategory_id) {
            return res.status(400).json({
                message: 'Category and Sub-Category are required.'
            });
        }

        // Only Active Categories and Sub-Categories can be selected (Business Rule)
        const activeCategory = await Category.findOne({
            where: {
                id: categoryId,
                status: 'active'
            }
        });
        const activeSubcategory = await Subcategory.findOne({
            where: {
                id: subcategory_id,
                status: 'active'
            }
        });

        if (!activeCategory || !activeSubcategory) {
            return res.status(400).json({
                message: 'Only Active Categories and Sub-Categories can be selected.'
            });
        }

        const payload = {
            name,
            categoryId,
            subcategory_id,
            description,
            discount,
            price_Type,
            status
        };

        // Admin-only fields guard
        if (userRole === 'admin' || userRole === 'adminuser') {
            payload.price = price;
            payload.commission_type = commission_type;
            payload.commission_fee = commission_fee;
        }

        const newService = await ServiceAdmin.create(payload);
        res.status(201).json(newService);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.updateAdminService = async (req, res) => {
    try {
        const service = await ServiceAdmin.findByPk(req.params.id);
        if (!service) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }

        const userRole = req.user && req.user.role;
        const {
            categoryId,
            subcategory_id,
            commission_value,
            commission_fee,
            price,
            commission_type,
            ...restBody
        } = req.body;

        // Validation if category/subcategory are being updated
        if (categoryId || subcategory_id) {
            const catId = categoryId || service.categoryId;
            const subId = subcategory_id || service.subcategory_id;

            const activeCategory = await Category.findOne({
                where: {
                    id: catId,
                    status: 'active'
                }
            });
            const activeSubcategory = await Subcategory.findOne({
                where: {
                    id: subId,
                    status: 'active'
                }
            });

            if (!activeCategory || !activeSubcategory) {
                return res.status(400).json({
                    message: 'Only Active Categories and Sub-Categories can be selected.'
                });
            }
        }

        let feeToUpdate = commission_fee;
        if (feeToUpdate === undefined && commission_value !== undefined) {
            feeToUpdate = commission_value;
        }

        const updateData = {
            ...restBody
        };
        if (categoryId !== undefined) updateData.categoryId = categoryId;
        if (subcategory_id !== undefined) updateData.subcategory_id = subcategory_id;

        // Admin-only fields guard
        if (userRole === 'admin' || userRole === 'adminuser') {
            if (feeToUpdate !== undefined) updateData.commission_fee = feeToUpdate;
            if (price !== undefined) updateData.price = price;
            if (commission_type !== undefined) updateData.commission_type = commission_type;
            if (req.body.price_Type) updateData.price_Type = req.body.price_Type;
        }

        await service.update(updateData);
        res.status(200).json(service);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.deleteAdminService = async (req, res) => {
    try {
        const service = await ServiceAdmin.findByPk(req.params.id);
        if (!service) {
            return res.status(404).json({
                message: 'Service not found'
            });
        }
        await service.destroy();
        res.status(200).json({
            message: 'Service deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};