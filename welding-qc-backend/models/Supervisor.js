const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Supervisor = sequelize.define('Supervisor', {
  supervisor_id: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  supervisor_name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  employee_id: {
    type: DataTypes.STRING,
    allowNull: true
  },
  department: {
    type: DataTypes.STRING,
    allowNull: true
  },
  contact_number: {
    type: DataTypes.STRING,
    allowNull: true
  },
  email: {
    type: DataTypes.STRING,
    allowNull: true
  },
  status: {
    type: DataTypes.ENUM('Active', 'Inactive'),
    defaultValue: 'Active'
  },
  remarks: {
    type: DataTypes.TEXT,
    allowNull: true
  }
}, {
  tableName: 'supervisors',
  timestamps: true
});

module.exports = Supervisor;
