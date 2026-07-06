const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const AreaSystem = sequelize.define('AreaSystem', {
  name: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
    primaryKey: true
  }
}, {
  tableName: 'area_systems',
  timestamps: true
});

module.exports = AreaSystem;
