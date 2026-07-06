const { OfferSheet, Joint, User } = require('../models');

const { Op } = require('sequelize');

exports.getAllOfferSheets = async (req, res) => {
  try {
    const whereClause = {};
    if (req.userRole === 1) {
      whereClause.supervisor_id = req.userId;
    }
    
    const { from, to } = req.query;
    if (from && to) {
      whereClause.date = { [Op.between]: [from, to] };
    } else if (from) {
      whereClause.date = { [Op.gte]: from };
    } else if (to) {
      whereClause.date = { [Op.lte]: to };
    }

    const sheets = await OfferSheet.findAll({ 
      where: whereClause,
      include: [
        { model: User, as: 'supervisor', attributes: ['id', 'username'] },
        { model: Joint, attributes: ['status', 'is_submitted'] }
      ],
      order: [['createdAt', 'DESC']] 
    });
    
    const transformed = sheets.map(sheet => {
      const joints = sheet.Joints || [];
      return {
        ...sheet.toJSON(),
        joints_created: joints.length,
        joints_completed: joints.filter(j => j.status === 'RT Accepted' || j.is_submitted).length
      };
    });

    res.status(200).json(transformed);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createOfferSheet = async (req, res) => {
  try {
    const { supervisor_id, target_joints, date, offer_sheet_file } = req.body;
    
    if (!supervisor_id || !target_joints || !date) {
      return res.status(400).json({ message: 'Missing required fields.' });
    }

    const idSuffix = Math.floor(1000 + Math.random() * 9000);
    const offer_sheet_id = `OS-${date.replace(/-/g, '')}-${idSuffix}`;

    const newSheet = await OfferSheet.create({
      offer_sheet_id,
      supervisor_id,
      target_joints,
      date,
      offer_sheet_file
    });

    req.app.get('io').emit('DATA_UPDATED', { module: 'offer-sheets', action: 'create' });
    res.status(201).json(newSheet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.getOfferSheetById = async (req, res) => {
  try {
    const { offer_sheet_id } = req.params;
    const sheet = await OfferSheet.findByPk(offer_sheet_id, {
      include: [
        { model: User, as: 'supervisor', attributes: ['id', 'username'] },
        { model: Joint, attributes: ['status', 'is_submitted', 'unique_code'] }
      ]
    });
    if (!sheet) return res.status(404).json({ message: 'Offer sheet not found.' });

    const joints = sheet.Joints || [];
    const responseData = {
      ...sheet.toJSON(),
      joints_created: joints.length,
      joints_completed: joints.filter(j => j.status === 'RT Accepted' || j.is_submitted).length
    };
    res.status(200).json(responseData);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateOfferSheet = async (req, res) => {
  try {
    const { offer_sheet_id } = req.params;
    const { offer_sheet_file } = req.body;

    if (req.userRole !== 1 && req.userRole !== 3) {
      return res.status(403).json({ message: 'Only Supervisors and Admins can update Offer Sheet files.' });
    }

    const sheet = await OfferSheet.findByPk(offer_sheet_id);
    if (!sheet) return res.status(404).json({ message: 'Offer sheet not found.' });

    await sheet.update({ offer_sheet_file });

    req.app.get('io').emit('DATA_UPDATED', { module: 'offer-sheets', action: 'update' });
    res.status(200).json(sheet);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
