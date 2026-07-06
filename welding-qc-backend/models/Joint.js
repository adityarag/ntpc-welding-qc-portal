const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Joint = sequelize.define('Joint', {
  unique_code: {
    type: DataTypes.STRING,
    primaryKey: true, // Area+Coil+Tube+Joint
  },
  offer_sheet_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'offer_sheets',
      key: 'offer_sheet_id'
    }
  },
  joint_id: {
    type: DataTypes.STRING,
    allowNull: false
  },
  area_system: {
    type: DataTypes.STRING,
  },
  coil_no: {
    type: DataTypes.STRING,
  },
  tube_no: {
    type: DataTypes.STRING,
  },
  material_spec: {
    type: DataTypes.STRING,
  },
  weld_size: {
    type: DataTypes.STRING,
  },
  welder_id: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'welders',
      key: 'welder_id'
    }
  },
  pwht_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: null
  },
  is_submitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending' // Pending, RT Uploaded, RT Accepted, RT Rejected
  }
}, {
  tableName: 'joints',
  timestamps: true,
});

module.exports = Joint;
