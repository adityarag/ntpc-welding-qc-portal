const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const OfferSheet = sequelize.define('OfferSheet', {
  offer_sheet_id: {
    type: DataTypes.STRING,
    primaryKey: true, // e.g. OS-20231015-001
  },
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  target_joints: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  date: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  offer_sheet_file: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  tableName: 'offer_sheets',
  timestamps: true,
});

module.exports = OfferSheet;
