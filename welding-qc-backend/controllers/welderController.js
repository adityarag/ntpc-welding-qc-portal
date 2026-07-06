const { Welder } = require('../models');

exports.getAllWelders = async (req, res) => {
  try {
    const welders = await Welder.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(welders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createWelder = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (req.userRole === 1 && req.userId) {
      payload.supervisor_id = req.userId;
    }
    const newWelder = await Welder.create(payload);
    req.app.get('io').emit('DATA_UPDATED', { module: 'welders', action: 'create' });
    res.status(201).json(newWelder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.updateWelder = async (req, res) => {
  try {
    const { id } = req.params;
    const welder = await Welder.findByPk(id);
    if (!welder) return res.status(404).json({ message: 'Welder not found.' });

    await welder.update(req.body);
    req.app.get('io').emit('DATA_UPDATED', { module: 'welders', action: 'update' });
    res.status(200).json(welder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
