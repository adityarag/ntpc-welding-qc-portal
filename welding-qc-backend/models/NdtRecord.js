const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const NdtRecord = sequelize.define('NdtRecord', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  joint_id: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'joints',
      key: 'unique_code'
    }
  },
  type: {
    type: DataTypes.ENUM('RT', 'PAUT', 'MPI'),
    allowNull: false,
  },
  inspection_turn: {
    type: DataTypes.INTEGER,
    defaultValue: 1,
  },
  date: {
    type: DataTypes.DATEONLY,
  },
  result: {
    type: DataTypes.ENUM('Pending', 'Pass', 'Fail'),
    defaultValue: 'Pending',
  },
  defect_type: {
    type: DataTypes.STRING,
  },
  attached_file: {
    type: DataTypes.STRING,
  },
  remark_number: {
    type: DataTypes.STRING,
  },
  report_file: {
    type: DataTypes.STRING,
  },
  report_date: {
    type: DataTypes.DATEONLY,
  }
}, {
  tableName: 'ndt_records',
  timestamps: true,
});

module.exports = NdtRecord;
