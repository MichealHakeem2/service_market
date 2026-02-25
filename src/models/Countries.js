const {
    DataTypes
} = require('sequelize');
const sequelize = require('../config/db');
const Country = sequelize.define('Country', {
    id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false
    },
    iso2: {
        type: DataTypes.STRING,
        allowNull: false
    },
    iso3: {
        type: DataTypes.STRING,
        allowNull: false
    },
    phone_code: {
        type: DataTypes.STRING,
        allowNull: false
    },
    flag_emoji: {
        type: DataTypes.STRING,
        allowNull: false
    }
}, {
    tableName: 'countries',
    timestamps: false,
});
module.exports = Country;