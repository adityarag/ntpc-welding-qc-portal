const { NdtRecord, OfferSheet, Joint } = require('../models');
const { Op } = require('sequelize');

exports.getNdtRecordsByType = async (req, res) => {
  try {
    const { type } = req.params;
    
    let jointInclude = {
      model: Joint,
      attributes: ['area_system', 'joint_id', 'welder_id', 'unique_code', 'coil_no', 'tube_no'],
      include: [{ model: OfferSheet, attributes: ['supervisor_id'] }]
    };

    if (req.userRole === 1) {
      jointInclude.include[0].where = { supervisor_id: req.userId };
    }

    const { from, to } = req.query;
    const whereClause = { type };
    if (from && to) {
      whereClause.date = { [Op.between]: [from, to] };
    } else if (from) {
      whereClause.date = { [Op.gte]: from };
    } else if (to) {
      whereClause.date = { [Op.lte]: to };
    }

    const records = await NdtRecord.findAll({
      where: whereClause,
      include: [jointInclude],
      order: [['createdAt', 'DESC']]
    });

    const formatted = records.map(r => ({
      id: r.id,
      joint_id: r.Joint?.joint_id,
      unique_code: r.joint_id, // unique_code is stored in joint_id column
      area_system: r.Joint?.area_system,
      coil_no: r.Joint?.coil_no,
      tube_no: r.Joint?.tube_no,
      welder_id: r.Joint?.welder_id,
      type: r.type,
      inspection_turn: r.inspection_turn,
      date: r.date,
      result: r.result,
      defect_type: r.defect_type,
      attached_file: r.attached_file,
      remark_number: r.remark_number,
      report_file: r.report_file,
      report_date: r.report_date
    }));

    res.status(200).json(formatted);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createNdtRecord = async (req, res) => {
  try {
    const { type } = req.params;
    const newRecord = await NdtRecord.create({ ...req.body, type });
    req.app.get('io').emit('DATA_UPDATED', { module: 'ndt', action: 'create' });
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateNdtRecord = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await NdtRecord.findByPk(id);
    if (!record) return res.status(404).json({ message: 'NDT record not found.' });

    const { date, result, defect_type, remark_number, report_file, report_date } = req.body;

    const updates = {};
    if (date !== undefined) updates.date = date;
    if (result !== undefined) updates.result = result;
    if (defect_type !== undefined) updates.defect_type = defect_type;
    if (remark_number !== undefined) updates.remark_number = remark_number;
    if (report_file !== undefined) updates.report_file = report_file;
    if (report_date !== undefined) updates.report_date = report_date;

    await record.update(updates);

    if (result === 'Fail') {
      const joint = await Joint.findByPk(record.joint_id, {
        include: [{ model: OfferSheet }]
      });
      if (joint && joint.OfferSheet && joint.OfferSheet.supervisor_id) {
        const { ActionAlert } = require('../models');
        await ActionAlert.create({
          supervisor_id: joint.OfferSheet.supervisor_id,
          joint_id: record.joint_id,
          ndt_record_id: record.id,
          message: `${record.type} Inspection (Turn ${record.inspection_turn}) Failed. Defect: ${defect_type || 'Unknown'}`
        });
      }
    }

    req.app.get('io').emit('DATA_UPDATED', { module: 'ndt', action: 'update' });
    res.status(200).json(record);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.incrementAttempt = async (req, res) => {
  try {
    const { id } = req.params;
    const record = await NdtRecord.findByPk(id);
    if (!record) return res.status(404).json({ message: 'NDT record not found.' });

    if (record.inspection_turn >= 3) {
      return res.status(400).json({ message: 'Maximum 3 attempts reached.' });
    }

    if (record.result !== 'Fail') {
      return res.status(400).json({ message: 'Can only increment attempt if previous attempt failed.' });
    }

    const newRecord = await NdtRecord.create({
      joint_id: record.joint_id,
      type: record.type,
      inspection_turn: record.inspection_turn + 1,
      result: 'Pending'
    });

    req.app.get('io').emit('DATA_UPDATED', { module: 'ndt', action: 'increment' });
    res.status(201).json(newRecord);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
