const {
    DataTypes
} = require('sequelize');
const sequelize = require('../config/db');

const RolePortalAccess = sequelize.define('RolePortalAccess', {
    role: {
        type: DataTypes.ENUM('admin', 'provider', 'customer'),
        primaryKey: true,
        allowNull: false
    },
    portalType: {
        type: DataTypes.ENUM('AdminPortal', 'CustomerPortal', 'ProviderPortal'),
        primaryKey: true,
        allowNull: false
    }
}, {
    tableName: 'role_portal_access',
    timestamps: false
});

module.exports = RolePortalAccess;