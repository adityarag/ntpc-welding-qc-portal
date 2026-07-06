const { RtAttempt, Joint, OfferSheet } = require('../models');

exports.uploadRt = async (req, res) => {
  try {
    const { unique_code } = req.params;
    const { rt_photo_url, weld_photo_url, remark_number, report_file, report_date } = req.body;
    
    const attempts = await RtAttempt.findAll({ where: { unique_code } });
    if (attempts.length >= 3) {
      return res.status(400).json({ message: 'Maximum 3 RT attempts reached for this joint.' });
    }

    const newAttempt = await RtAttempt.create({
      unique_code,
      attempt_number: attempts.length + 1,
      rt_photo_url: rt_photo_url || report_file, 
      weld_photo_url,
      remark_number,
      report_file,
      report_date,
      status: 'Pending'
    });

    await Joint.update({ status: 'RT Uploaded' }, { where: { unique_code } });
    req.app.get('io').emit('DATA_UPDATED', { module: 'rt-attempts', action: 'create' });
    res.status(201).json(newAttempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateRtAttempt = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const attempt = await RtAttempt.findByPk(attempt_id);
    if (!attempt) return res.status(404).json({ message: 'Not found' });
    
    const { status, defect_type, report_date, report_file, remark_number } = req.body;
    if (status !== undefined) attempt.status = status;
    if (defect_type !== undefined) attempt.defect_type = defect_type;
    if (report_date !== undefined) attempt.report_date = report_date;
    if (report_file !== undefined) attempt.report_file = report_file;
    if (remark_number !== undefined) attempt.remark_number = remark_number;
    
    await attempt.save();
    
    req.app.get('io').emit('DATA_UPDATED', { module: 'rt-attempts', action: 'update' });
    res.status(200).json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.incrementAttempt = async (req, res) => {
  try {
    const { unique_code } = req.params;
    const attempts = await RtAttempt.findAll({ where: { unique_code }, order: [['attempt_number', 'DESC']] });
    
    if (attempts.length === 0) return res.status(400).json({ message: 'No existing attempts' });
    
    const latestAttempt = attempts[0];
    if (latestAttempt.attempt_number >= 3) {
      return res.status(400).json({ message: 'Maximum 3 attempts reached.' });
    }
    
    if (latestAttempt.status !== 'Fail' && latestAttempt.status !== 'Rejected' && latestAttempt.status !== 'Fail / Repair Required') {
      return res.status(400).json({ message: 'Can only increment attempt if previous attempt failed.' });
    }
    
    const newAttempt = await RtAttempt.create({
      unique_code,
      attempt_number: latestAttempt.attempt_number + 1,
      status: 'Pending'
    });
    
    req.app.get('io').emit('DATA_UPDATED', { module: 'rt-attempts', action: 'create' });
    res.status(201).json(newAttempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyRt = async (req, res) => {
  try {
    const { attempt_id } = req.params;
    const { status, remarks } = req.body;

    const attempt = await RtAttempt.findByPk(attempt_id);
    if (!attempt) return res.status(404).json({ message: 'RT Attempt not found' });

    if (req.userRole === 2) {
      attempt.verified_by_id = req.userId;
      attempt.verified_at = new Date();
      attempt.status = status;
      attempt.remarks = remarks;
      await attempt.save();
    } else if (req.userRole === 3) {
      attempt.approved_by_id = req.userId;
      attempt.verified_at = new Date();
      attempt.status = status;
      attempt.remarks = remarks;
      await attempt.save();
    }

    const jointStatus = (status === 'Accepted' || status === 'Pass / Compliant') ? 'RT Accepted' : 'RT Rejected';
    await Joint.update({ status: jointStatus }, { where: { unique_code: attempt.unique_code } });

    req.app.get('io').emit('DATA_UPDATED', { module: 'rt-attempts', action: 'update' });
    res.status(200).json(attempt);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const { Op } = require('sequelize');

exports.getAllRtAttempts = async (req, res) => {
  try {
    let jointInclude = {
      model: Joint,
      attributes: ['area_system', 'joint_id', 'welder_id', 'offer_sheet_id', 'unique_code', 'coil_no', 'tube_no'],
      include: [{ model: OfferSheet, attributes: ['supervisor_id'] }]
    };

    if (req.userRole === 1) {
      jointInclude.include[0].where = { supervisor_id: req.userId };
    }

    const { from, to } = req.query;
    const whereClause = {};
    if (from && to) {
      whereClause.report_date = { [Op.between]: [from, to] };
    } else if (from) {
      whereClause.report_date = { [Op.gte]: from };
    } else if (to) {
      whereClause.report_date = { [Op.lte]: to };
    }

    const attempts = await RtAttempt.findAll({
      where: whereClause,
      include: [jointInclude],
      order: [['createdAt', 'DESC']]
    });
    
    const formatted = attempts.map(a => ({
      attempt_id: a.attempt_id,
      unique_code: a.unique_code,
      attempt_number: a.attempt_number,
      status: a.status,
      defect_type: a.defect_type,
      report_file: a.report_file,
      report_date: a.report_date,
      remark_number: a.remark_number,
      verified_by_id: a.verified_by_id,
      verified_at: a.verified_at,
      is_submitted: a.is_submitted,
      submission_batch_id: a.submission_batch_id,
      joint_id: a.Joint?.joint_id,
      area_system: a.Joint?.area_system,
      coil_no: a.Joint?.coil_no,
      tube_no: a.Joint?.tube_no,
      welder_id: a.Joint?.welder_id,
      offer_sheet_id: a.Joint?.offer_sheet_id
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
