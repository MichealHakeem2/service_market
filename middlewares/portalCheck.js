const RolePortal = require('../models/RolePortalAccess');

const portalCheck = (portalType) => {

    return async (req, res, next) => {
        try {

            if (!req.user)
                return res.status(403).json({
                    message: "User context missing"
                });

            const role = req.user.role;
            const portals = Array.isArray(portalType) ? portalType : [portalType];

            // Query mapping table for ANY of the portals
            const access = await RolePortal.findOne({
                where: {
                    role: role,
                    portalType: {
                        [require('sequelize').Op.in]: portals
                    }
                }
            });

            if (!access) {
                return res.status(403).json({
                    message: `Role '${role}' cannot access requested portals: ${portals.join(', ')}`
                });
            }

            next();

        } catch (err) {
            res.status(500).json({
                message: err.message
            });
        }
    };
};

module.exports = portalCheck;