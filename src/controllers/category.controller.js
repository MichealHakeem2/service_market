const Category = require('../models/Category');
const Subcategory = require('../models/Subcategory');

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
    try {
        const categoryData = {
            ...req.body
        };
        if (req.file) {
            categoryData.image = req.file.filename;
        }
        const category = await Category.create(categoryData);
        res.status(201).json(category);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.updateCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
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
        await category.update(categoryData);
        res.status(200).json(category);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.deleteCategory = async (req, res) => {
    try {
        const category = await Category.findByPk(req.params.id);
        if (!category) {
            return res.status(404).json({
                message: 'Category not found'
            });
        }
        const subcategoryCount = await Subcategory.count({
            where: {
                categoryId: req.params.id
            }
        });

        if (subcategoryCount > 0) {
            return res.status(400).json({
                message: 'Cannot delete Category: It has one or more linked Sub-Categories. Please delete or reassign them first.'
            });
        }

        await category.destroy();
        res.status(200).json({
            message: 'Category deleted successfully'
        });
    } catch (err) {
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