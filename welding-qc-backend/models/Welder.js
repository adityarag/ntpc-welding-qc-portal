const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Welder = sequelize.define('Welder', {
  welder_id: {
    type: DataTypes.STRING,
    primaryKey: true,
  },
  welder_name: {
    type: DataTypes.STRING,
    allowNull: false,
  },
  qualification: {
    type: DataTypes.STRING,
  },
  employer: {
    type: DataTypes.STRING,
  },
  contact_number: {
    type: DataTypes.STRING,
  },
  notes: {
    type: DataTypes.TEXT,
  },
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  }
}, {
  tableName: 'welders',
  timestamps: true,
});

module.exports = Welder;
