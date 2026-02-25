const Notification = require('../models/Notification');

exports.getNotifications = async (req, res) => {
    try {
        const notifications = await Notification.findAll({
            where: {
                userId: req.user.id
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });
        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.markAsRead = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found'
            });
        }
        if (notification.userId !== req.user.id) {
            return res.status(403).json({
                message: 'Unauthorized'
            });
        }
        await notification.update({
            readStatus: 'read'
        });
        res.status(200).json(notification);
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};

exports.deleteNotification = async (req, res) => {
    try {
        const notification = await Notification.findByPk(req.params.id);
        if (!notification) {
            return res.status(404).json({
                message: 'Notification not found'
            });
        }
        if (notification.userId !== req.user.id) {
            return res.status(403).json({
                message: 'Unauthorized'
            });
        }
        await notification.destroy();
        res.status(200).json({
            message: 'Notification deleted successfully'
        });
    } catch (err) {
        res.status(500).json({
            message: err.message
        });
    }
};
exports.createNotification = async (userId, type, message, relatedId, relatedType, options = {}) => {
    try {
        await Notification.create({
            userId,
            type,
            message,
            relatedId,
            relatedType
        }, options);
    } catch (err) {
        console.error('Failed to create notification:', err);
    }
};