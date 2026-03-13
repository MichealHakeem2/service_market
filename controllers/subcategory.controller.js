const subcategory = require('../models/Subcategory');
const category = require('../models/Category');
const Service = require('../models/Service');
const sequelize = require('../config/db');
exports.getAllSubcategory = async (req, res) => {
    try {
        const subcategories = await subcategory.findAll();
        res.status(200).json(subcategories);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getSubcategoryByCategoryId = async (req, res) => {
    try {
        const cat = await category.findByPk(req.params.categoryId);
        if (!cat) {
            return res.status(404).json({
                message: "Category not found"
            });
        }
        const subcategories = await subcategory.findAll({
            where: {
                categoryId: cat.id
            }
        });
        res.status(200).json(subcategories);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.createSubcategory = async (req, res) => {
    try {
        const subcategoryData = {
            ...req.body
        };
        if (req.file) {
            subcategoryData.image = req.file.filename;
        }
        if (subcategoryData.categoryId && typeof subcategoryData.categoryId === 'string' && subcategoryData.categoryId.trim() !== "") {
            subcategoryData.categoryId = parseInt(subcategoryData.categoryId);
        }
        const subcategories = await subcategory.create(subcategoryData);
        res.status(201).json(subcategories);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.updateSubcategory = async (req, res) => {
    try {
        const subcategoryToUpdate = await subcategory.findByPk(req.params.id);
        if (!subcategoryToUpdate) {
            return res.status(404).json({
                message: "Subcategory not found"
            });
        }

        const updateData = {
            ...req.body
        };
        if (req.file) {
            updateData.image = req.file.filename;
        }

        if (updateData.categoryId) {
            updateData.categoryId = parseInt(updateData.categoryId);
        }

        await subcategoryToUpdate.update(updateData);
        const result = await subcategory.findByPk(req.params.id);
        res.status(200).json(result);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.deleteSubcategory = async (req, res) => {
    try {
        const subcategoryToUpdate = await subcategory.findByPk(req.params.id);
        if (!subcategoryToUpdate) {
            return res.status(404).json({
                message: "Subcategory not found"
            });
        }
        const serviceCount = await Service.count({
            where: {
                subcategoryId: req.params.id
            }
        });

        if (serviceCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete Sub-Category: It has one or more linked Services. Please delete or reassign them first.'
            });
        }

        await subcategoryToUpdate.destroy();
        res.status(200).json({
            message: 'Sub-Category deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
exports.getAllActiveSubcategory = async (req, res) => {
    try {
        const subcategories = await subcategory.findAll({
            where: {
                status: 'active'
            },
            include: [{
                model: category,
                attributes: ['id', 'name'],
                where: {
                    status: 'active'
                }
            }]
        });
        res.status(200).json(subcategories);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
}
