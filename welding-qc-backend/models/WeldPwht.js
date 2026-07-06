const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const WeldPwht = sequelize.define('WeldPwht', {
  joint_id: {
    type: DataTypes.STRING,
    primaryKey: true,
    references: {
      model: 'joints',
      key: 'unique_code'
    }
  },
  electrode: {
    type: DataTypes.STRING,
  },
  wps_no: {
    type: DataTypes.STRING,
  },
  hardness: {
    type: DataTypes.STRING,
  },
  rt_date_1: {
    type: DataTypes.DATEONLY,
  },
  rt_date_2: {
    type: DataTypes.DATEONLY,
  },
  rt_date_3: {
    type: DataTypes.DATEONLY,
  },
  pwht_required: {
    type: DataTypes.BOOLEAN,
    defaultValue: null,
  },
  pwht_chart_number: {
    type: DataTypes.STRING,
  },
  pwht_date: {
    type: DataTypes.DATEONLY,
  },
  pwht_status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending',
  },
  pwht_remarks: {
    type: DataTypes.STRING,
  },
  report_file: {
    type: DataTypes.STRING,
  },
  remark_number: {
    type: DataTypes.STRING,
  },
  report_date: {
    type: DataTypes.DATEONLY,
  },
  verified_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  verified_at: {
    type: DataTypes.DATE,
    allowNull: true
  },
  is_submitted: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  }
}, {
  tableName: 'welds_pwht',
  timestamps: true,
});

module.exports = WeldPwht;
