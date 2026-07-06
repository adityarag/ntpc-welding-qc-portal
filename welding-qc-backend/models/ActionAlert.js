const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const ActionAlert = sequelize.define('ActionAlert', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  supervisor_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  joint_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'joints',
      key: 'unique_code'
    }
  },
  ndt_record_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'ndt_records',
      key: 'id'
    }
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('Unread', 'Resolved'),
    defaultValue: 'Unread'
  }
}, {
  tableName: 'action_alerts',
  timestamps: true,
});

module.exports = ActionAlert;
