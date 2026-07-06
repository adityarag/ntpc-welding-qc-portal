const { WeldPwht, OfferSheet, Joint, User } = require('../models');
const { Op } = require('sequelize');

exports.getAllWelds = async (req, res) => {
  try {
    let jointInclude = {
      model: Joint,
      attributes: ['area_system', 'joint_id', 'welder_id', 'unique_code', 'coil_no', 'tube_no'],
      include: [{ model: OfferSheet, attributes: ['supervisor_id'] }]
    };

    if (req.userRole === 1) {
      jointInclude.include[0].where = { supervisor_id: req.userId };
    }

    const { from, to, dateType } = req.query;
    const whereClause = {};
    if (from && to) {
      if (dateType === 'createdAt') {
        whereClause.createdAt = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
      } else {
        whereClause.pwht_date = { [Op.between]: [from, to] };
      }
    } else if (from) {
      if (dateType === 'createdAt') {
        whereClause.createdAt = { [Op.gte]: from + ' 00:00:00' };
      } else {
        whereClause.pwht_date = { [Op.gte]: from };
      }
    } else if (to) {
      if (dateType === 'createdAt') {
        whereClause.createdAt = { [Op.lte]: to + ' 23:59:59' };
      } else {
        whereClause.pwht_date = { [Op.lte]: to };
      }
    }

    const welds = await WeldPwht.findAll({
      where: whereClause,
      include: [
        jointInclude,
        { model: User, as: 'verifier', attributes: ['username'] }
      ],
      order: [['createdAt', 'DESC']]
    });

    const formatted = welds.map(w => ({
      joint_id: w.Joint?.joint_id,
      unique_code: w.joint_id, // unique_code is stored in joint_id column of WeldPwht!
      area_system: w.Joint?.area_system,
      coil_no: w.Joint?.coil_no,
      tube_no: w.Joint?.tube_no,
      welder_id: w.Joint?.welder_id,
      rt_date_1: w.rt_date_1,
      rt_date_2: w.rt_date_2,
      rt_date_3: w.rt_date_3,
      hardness: w.hardness,
      pwht_chart_number: w.pwht_chart_number,
      pwht_date: w.pwht_date,
      pwht_status: w.pwht_status,
      pwht_remarks: w.pwht_remarks,
      remark_number: w.remark_number,
      report_date: w.report_date,
      report_file: w.report_file,
      verified_by: w.verifier?.username,
      verified_at: w.verified_at
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateWeld = async (req, res) => {
  try {
    const { joint_id } = req.params; // unique_code of joint
    
    if (req.userRole !== 1) {
      return res.status(403).json({ message: 'Only Supervisors can edit PWHT fields.' });
    }

    const weld = await WeldPwht.findByPk(joint_id);
    if (!weld) return res.status(404).json({ message: 'Weld record not found.' });

    if (weld.pwht_status === 'Completed') {
      return res.status(403).json({ message: 'This PWHT record has been verified and is locked.' });
    }

    const { 
      pwht_chart_number, pwht_date, pwht_remarks, report_file, report_date, remark_number,
      hardness, rt_date_1, rt_date_2, rt_date_3
    } = req.body;

    const updates = {};
    if (pwht_chart_number !== undefined) updates.pwht_chart_number = pwht_chart_number;
    if (pwht_date !== undefined) updates.pwht_date = pwht_date;
    if (pwht_remarks !== undefined) updates.pwht_remarks = pwht_remarks;
    if (report_file !== undefined) updates.report_file = report_file;
    if (report_date !== undefined) updates.report_date = report_date;
    if (remark_number !== undefined) updates.remark_number = remark_number;
    if (hardness !== undefined) updates.hardness = hardness;
    if (rt_date_1 !== undefined) updates.rt_date_1 = rt_date_1;
    if (rt_date_2 !== undefined) updates.rt_date_2 = rt_date_2;
    if (rt_date_3 !== undefined) updates.rt_date_3 = rt_date_3;

    if (weld.pwht_status === 'Pending') {
      updates.pwht_status = 'In Progress';
    }

    await weld.update(updates);
    
    req.app.get('io').emit('DATA_UPDATED', { module: 'welds', action: 'update' });
    res.status(200).json(weld);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.verifyWeld = async (req, res) => {
  try {
    const { joint_id } = req.params; // unique_code of joint
    const { status } = req.body; // 'Completed' or 'Rejected'

    if (req.userRole !== 2 && req.userRole !== 3) {
      return res.status(403).json({ message: 'Only Verifiers and Admins can verify PWHT.' });
    }

    const weld = await WeldPwht.findByPk(joint_id);
    if (!weld) return res.status(404).json({ message: 'Weld record not found.' });

    await weld.update({
      pwht_status: status,
      verified_by_id: req.userId,
      verified_at: new Date()
    });

    const jointStatus = status === 'Completed' ? 'PWHT Completed' : 'PWHT Rejected';
    await Joint.update({ status: jointStatus }, { where: { unique_code: joint_id } });

    req.app.get('io').emit('DATA_UPDATED', { module: 'welds', action: 'update' });
    res.status(200).json(weld);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getPwhtExport = async (req, res) => {
  try {
    const welds = await WeldPwht.findAll({
      where: { pwht_required: true },
      include: [{ model: Joint, attributes: ['unique_code'] }],
      order: [['createdAt', 'DESC']]
    });
    
    const formatted = welds.map(w => ({
      'Unique Code': w.Joint?.unique_code || 'N/A',
      'Joint ID': w.joint_id,
      '1st RT Date': w.rt_date_1 || '',
      '2nd RT Date': w.rt_date_2 || '',
      '3rd RT Date': w.rt_date_3 || '',
      'PWHT Chart Number': w.pwht_chart_number || '',
      'PWHT Date': w.pwht_date || '',
      'Hardness': w.hardness || '',
      'Status': w.pwht_status || 'Pending',
      'Remarks': w.pwht_remarks || '',
      'Remark Number': w.remark_number || '',
      'Report Date': w.report_date || '',
      'Report File': w.report_file || ''
    }));
    
    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
