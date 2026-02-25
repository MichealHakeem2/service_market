const Token = require("../models/Token");
const User = require("../models/Users");
const sequelize = require("../config/db");
const {
    Op
} = require("sequelize");
exports.getAllToken = async (req, res) => {
    try {
        const allToken = await Token.findAll();
        res.status(200).json(allToken);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.getOneToken = async (req, res) => {
    try {
        const userId = req.params.id;
        const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
        const activeToken = await Token.findOne({
            where: {
                user_id: userId,
                status: 'active',
                createdAt: {
                    [Op.gt]: oneHourAgo
                }
            },
            order: [
                ['createdAt', 'DESC']
            ]
        });

        if (!activeToken) {
            await Token.update({
                status: 'expired'
            }, {
                where: {
                    user_id: userId,
                    status: 'active',
                    createdAt: {
                        [Op.lte]: oneHourAgo
                    }
                }
            });
            return res.status(404).json({
                message: "No active token found or token expired"
            });
        }

        res.status(200).json(activeToken);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}
exports.deleteToken = async (req, res) => {
    try {
        const result = await Token.destroy({
            where: {
                id: req.params.id
            }
        });
        res.status(200).json({
            message: "Token deleted successfully",
            result
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}