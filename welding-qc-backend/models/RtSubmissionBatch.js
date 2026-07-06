const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const RtSubmissionBatch = sequelize.define('RtSubmissionBatch', {
  submission_batch_id: {
    type: DataTypes.STRING,
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
  offer_sheet_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'offer_sheets',
      key: 'offer_sheet_id'
    }
  },
  submitted_at: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: DataTypes.NOW
  },
  weld_count: {
    type: DataTypes.INTEGER,
    allowNull: false,
    defaultValue: 0
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'PENDING'
  }
}, {
  tableName: 'rt_submission_batches',
  timestamps: true,
});

module.exports = RtSubmissionBatch;
