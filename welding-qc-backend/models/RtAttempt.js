const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RtAttempt = sequelize.define('RtAttempt', {
  attempt_id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  unique_code: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'joints',
      key: 'unique_code'
    }
  },
  attempt_number: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 1 // 1, 2, or 3
  },
  rt_photo_url: {
    type: DataTypes.TEXT,
  },
  weld_photo_url: {
    type: DataTypes.TEXT,
  },
  remark_number: {
    type: DataTypes.STRING,
  },
  report_file: {
    type: DataTypes.STRING,
  },
  report_date: {
    type: DataTypes.DATEONLY,
  },
  status: {
    type: DataTypes.STRING,
    defaultValue: 'Pending' // Pending, Accepted, Rejected
  },
  submission_batch_id: {
    type: DataTypes.STRING,
    allowNull: true,
    references: {
      model: 'rt_submission_batches',
      key: 'submission_batch_id'
    }
  },
  is_submitted: {
    type: DataTypes.BOOLEAN,
    allowNull: false,
    defaultValue: false
  },
  verified_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  approved_by_id: {
    type: DataTypes.INTEGER,
    allowNull: true,
    references: {
      model: 'users',
      key: 'id'
    }
  },
  remarks: {
    type: DataTypes.TEXT
  },
  defect_type: {
    type: DataTypes.STRING,
  },
  verified_at: {
    type: DataTypes.DATE,
  }
}, {
  tableName: 'rt_attempts',
  timestamps: true,
});

module.exports = RtAttempt;
