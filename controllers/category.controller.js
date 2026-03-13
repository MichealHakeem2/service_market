const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');
const sequelize = require('../config/db');

exports.getAllCategories = async (req, res) => {
    try {
        const categories = await Category.findAll();
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.getCategoryById = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.createCategory = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const categoryData = {
            ...req.body
        };
        if (req.file) {
            categoryData.image = req.file.filename;
        }
        const category = await Category.create(categoryData, {
            transaction: t
        });
        await t.commit();
        res.status(201).json(category);
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({
            message: err.message
        });
    }
};

exports.updateCategory = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const category = await Category.findByPk(req.params.id, {
            transaction: t
        });
        if (!category) {
            await t.rollback();
            return res.status(404).json({
                message: 'Category not found'
            });
        }
        const categoryData = {
            ...req.body
        };
        if (req.file) {
            categoryData.image = req.file.filename;
        }
        await category.update(categoryData, {
            transaction: t
        });
        await t.commit();
        res.status(200).json(category);
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({
            message: err.message
        });
    }
};

exports.deleteCategory = async (req, res) => {
    let t;
    try {
        t = await sequelize.transaction();
        const category = await Category.findByPk(req.params.id, {
            transaction: t
        });
        if (!category) {
            await t.rollback();
            return res.status(404).json({
                message: 'Category not found'
            });
        }
        const subcategoryCount = await Subcategory.count({
            where: {
                categoryId: req.params.id
            },
            transaction: t
        });

        if (subcategoryCount > 0) {
            await t.rollback();
            return res.status(400).json({
                message: 'Cannot delete Category: It has one or more linked Sub-Categories. Please delete or reassign them first.'
            });
        }

        await category.destroy({
            transaction: t
        });
        await t.commit();
        res.status(200).json({
            message: 'Category deleted successfully'
        });
    } catch (err) {
        if (t) await t.rollback();
        res.status(500).json({
            message: err.message
        });
    }
};
exports.getAllActiveCategory = async (req, res) => {
    try {
        const categories = await Category.findAll({
            where: {
                status: 'active'
            },
            include: [{
                model: Subcategory,
                where: {
                    status: 'active'
                }
            }]
        });
        res.status(200).json(categories);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};