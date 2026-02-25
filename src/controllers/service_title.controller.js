const service_title = require('../models/Service_title');
const sequelize = require('../config/db');
const { Op } = require('sequelize');
exports.getAllServiceTitle = async (req, res) => {
    try {
        const service_titleData = await service_title.findAll();
        res.status(200).json(service_titleData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
exports.getServiceTitleById = async (req, res) => {
    try {
        const service_titleData = await service_title.findByPk(req.params.id);
        if (!service_titleData) return res.status(404).json({ message: 'Service title not found' });
        res.status(200).json(service_titleData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
exports.createServiceTitle = async (req, res) => {
    try {
        const newServiceTitle = await service_title.create(req.body);
        res.status(201).json(newServiceTitle);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
exports.updateServiceTitle = async (req, res) => {
    try {
        const service_titleData = await service_title.findByPk(req.params.id);
        if (!service_titleData) return res.status(404).json({ message: 'Service title not found' });
        await service_titleData.update(req.body);
        res.status(200).json(service_titleData);
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}
exports.deleteServiceTitle = async (req, res) => {
    try {
        const service_titleData = await service_title.findByPk(req.params.id);
        if (!service_titleData) return res.status(404).json({ message: 'Service title not found' });
        await service_titleData.destroy();
        res.status(200).json({ message: 'Service title deleted successfully' });
    } catch (err) {
        res.status(500).json({ message: err.message });
    }
}