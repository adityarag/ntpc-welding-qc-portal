const sequelize = require('../config/database');
const User = require('./User');
const Welder = require('./Welder');
const OfferSheet = require('./OfferSheet');
const Joint = require('./Joint');
const RtAttempt = require('./RtAttempt');
const WeldPwht = require('./WeldPwht');
const NdtRecord = require('./NdtRecord');
const ActionAlert = require('./ActionAlert');
const Supervisor = require('./Supervisor');
const AreaSystem = require('./AreaSystem');
const RtSubmissionBatch = require('./RtSubmissionBatch');

// Define associations
User.hasMany(Welder, { foreignKey: 'supervisor_id' });
Welder.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });

// Offer Sheet -> Supervisor
User.hasMany(OfferSheet, { foreignKey: 'supervisor_id' });
OfferSheet.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });

// Offer Sheet -> Joints
OfferSheet.hasMany(Joint, { foreignKey: 'offer_sheet_id' });
Joint.belongsTo(OfferSheet, { foreignKey: 'offer_sheet_id' });

// Joint -> Welder
Welder.hasMany(Joint, { foreignKey: 'welder_id' });
Joint.belongsTo(Welder, { foreignKey: 'welder_id' });

// Joint -> RT Attempts
Joint.hasMany(RtAttempt, { foreignKey: 'unique_code' });
RtAttempt.belongsTo(Joint, { foreignKey: 'unique_code' });

// RT Attempt -> Verifier & Admin
User.hasMany(RtAttempt, { foreignKey: 'verified_by_id', as: 'verifiedAttempts' });
RtAttempt.belongsTo(User, { foreignKey: 'verified_by_id', as: 'verifier' });

User.hasMany(RtAttempt, { foreignKey: 'approved_by_id', as: 'approvedAttempts' });
RtAttempt.belongsTo(User, { foreignKey: 'approved_by_id', as: 'approver' });

// Alert associations
User.hasMany(ActionAlert, { foreignKey: 'supervisor_id' });
ActionAlert.belongsTo(User, { foreignKey: 'supervisor_id' });

ActionAlert.belongsTo(Joint, { foreignKey: 'joint_id', targetKey: 'unique_code' });
ActionAlert.belongsTo(NdtRecord, { foreignKey: 'ndt_record_id' });

// PWHT -> Joint
Joint.hasOne(WeldPwht, { foreignKey: 'joint_id', sourceKey: 'unique_code' });
WeldPwht.belongsTo(Joint, { foreignKey: 'joint_id', targetKey: 'unique_code' });

// PWHT -> Verifier
User.hasMany(WeldPwht, { foreignKey: 'verified_by_id', as: 'verifiedPwhts' });
WeldPwht.belongsTo(User, { foreignKey: 'verified_by_id', as: 'verifier' });

// NDT -> Joint
Joint.hasMany(NdtRecord, { foreignKey: 'joint_id', sourceKey: 'unique_code' });
NdtRecord.belongsTo(Joint, { foreignKey: 'joint_id', targetKey: 'unique_code' });

User.belongsTo(Supervisor, { foreignKey: 'supervisor_profile_id', as: 'supervisorProfile' });
Supervisor.hasOne(User, { foreignKey: 'supervisor_profile_id' });

// RtSubmissionBatch associations
User.hasMany(RtSubmissionBatch, { foreignKey: 'supervisor_id' });
RtSubmissionBatch.belongsTo(User, { foreignKey: 'supervisor_id', as: 'supervisor' });
OfferSheet.hasMany(RtSubmissionBatch, { foreignKey: 'offer_sheet_id' });
RtSubmissionBatch.belongsTo(OfferSheet, { foreignKey: 'offer_sheet_id' });
RtSubmissionBatch.hasMany(RtAttempt, { foreignKey: 'submission_batch_id' });
RtAttempt.belongsTo(RtSubmissionBatch, { foreignKey: 'submission_batch_id' });

module.exports = {
  sequelize,
  User,
  Welder,
  OfferSheet,
  Joint,
  RtAttempt,
  WeldPwht,
  NdtRecord,
  ActionAlert,
  Supervisor,
  AreaSystem,
  RtSubmissionBatch
};
