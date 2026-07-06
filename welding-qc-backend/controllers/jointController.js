const { Joint, WeldPwht, OfferSheet, RtAttempt, NdtRecord, AreaSystem } = require('../models');
const { Op } = require('sequelize');

exports.getJointsByOfferSheet = async (req, res) => {
  try {
    const { offer_sheet_id } = req.params;
    const joints = await Joint.findAll({ where: { offer_sheet_id } });
    res.status(200).json(joints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getAllJoints = async (req, res) => {
  try {
    // If supervisor, only get joints belonging to their offer sheets
    let includeClause = [{ model: OfferSheet, attributes: ['supervisor_id'] }];
    
    if (req.userRole === 1) {
      includeClause[0].where = { supervisor_id: req.userId };
    }

    const { from, to } = req.query;
    const whereClause = {};
    if (from && to) {
      whereClause.createdAt = { [Op.between]: [from + ' 00:00:00', to + ' 23:59:59'] };
    } else if (from) {
      whereClause.createdAt = { [Op.gte]: from + ' 00:00:00' };
    } else if (to) {
      whereClause.createdAt = { [Op.lte]: to + ' 23:59:59' };
    }

    const joints = await Joint.findAll({ 
      where: whereClause,
      include: includeClause,
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(joints);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createJoint = async (req, res) => {
  try {
    const payload = { ...req.body };

    const offerSheet = await OfferSheet.findByPk(payload.offer_sheet_id);
    if (!offerSheet) {
      return res.status(404).json({ message: 'Offer Sheet not found.' });
    }

    if (!payload.area_system) {
      return res.status(400).json({ message: 'Area System is required.' });
    }
    const areaSystemExists = await AreaSystem.findByPk(payload.area_system.trim());
    if (!areaSystemExists) {
      return res.status(400).json({ message: 'Invalid Area System. You must select a predefined Area System.' });
    }

    const createdCount = await Joint.count({ where: { offer_sheet_id: payload.offer_sheet_id } });
    if (createdCount >= offerSheet.target_joints) {
      return res.status(400).json({ 
        message: `Joint limit exceeded. Assigned target for this offer sheet is ${offerSheet.target_joints} joints.` 
      });
    }
    const alphanumericRegex = /^[a-zA-Z0-9-]+$/;
    if (!alphanumericRegex.test(payload.area_system) || 
        !alphanumericRegex.test(payload.coil_no) || 
        !alphanumericRegex.test(payload.tube_no) || 
        !alphanumericRegex.test(payload.joint_id)) {
      return res.status(400).json({ message: 'Special characters are not allowed. Use A-Z, 0-9, and hyphens only.' });
    }

    const extractNumber = (str) => {
      const match = str.match(/\d+/);
      return match ? parseInt(match[0], 10) : 0;
    };
    if (extractNumber(payload.coil_no) > 999) return res.status(400).json({ message: 'Coil Number max 999.' });
    if (extractNumber(payload.tube_no) > 99) return res.status(400).json({ message: 'Tube Number max 99.' });
    if (extractNumber(payload.joint_id) > 99) return res.status(400).json({ message: 'Joint Number max 99.' });

    const uniqueCode = `${payload.area_system}${payload.coil_no}${payload.tube_no}${payload.joint_id}`.toUpperCase();
    payload.unique_code = uniqueCode;

    const newJoint = await Joint.create(payload);

    if (payload.pwht_required) {
      await WeldPwht.create({ joint_id: newJoint.unique_code, pwht_required: true });
    }

    // Auto-create RT Attempt 1 for every new joint
    await RtAttempt.create({ unique_code: newJoint.unique_code, attempt_number: 1 });

    // Auto-create PAUT Attempt 1
    await NdtRecord.create({ joint_id: newJoint.unique_code, type: 'PAUT', inspection_turn: 1, result: 'Pending' });

    // Auto-create MPI Attempt 1
    await NdtRecord.create({ joint_id: newJoint.unique_code, type: 'MPI', inspection_turn: 1, result: 'Pending' });

    req.app.get('io').emit('DATA_UPDATED', { module: 'joints', action: 'create' });
    res.status(201).json(newJoint);
  } catch (err) {
    if (err.name === 'SequelizeUniqueConstraintError') {
      return res.status(409).json({ message: 'Duplicate Joint! A joint with this Area, Coil, Tube, and Joint ID already exists.' });
    }
    res.status(500).json({ message: err.message });
  }
};

exports.updateJoint = async (req, res) => {
  try {
    const { unique_code } = req.params;
    const joint = await Joint.findByPk(unique_code);
    if (!joint) return res.status(404).json({ message: 'Joint not found' });
    
    await joint.update(req.body);

    if (req.body.pwht_required !== undefined && req.body.pwht_required !== null) {
      const existingPwht = await WeldPwht.findOne({ where: { joint_id: unique_code } });
      if (req.body.pwht_required && !existingPwht) {
        await WeldPwht.create({ joint_id: unique_code, pwht_required: true });
      } else if (!req.body.pwht_required && existingPwht) {
        await existingPwht.destroy();
      }
    }

    req.app.get('io').emit('DATA_UPDATED', { module: 'joints', action: 'update' });
    res.status(200).json(joint);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
