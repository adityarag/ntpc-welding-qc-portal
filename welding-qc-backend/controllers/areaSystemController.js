const { AreaSystem } = require('../models');

exports.getAllAreaSystems = async (req, res) => {
  try {
    const list = await AreaSystem.findAll({ order: [['name', 'ASC']] });
    res.status(200).json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createAreaSystem = async (req, res) => {
  try {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).json({ message: 'Area System Name/Code is required.' });
    }
    
    const normalized = name.trim();
    const alphanumericRegex = /^[a-zA-Z0-9-]+$/;
    if (!alphanumericRegex.test(normalized)) {
      return res.status(400).json({ message: 'Special characters are not allowed. Use A-Z, 0-9, and hyphens only.' });
    }
    
    const existing = await AreaSystem.findByPk(normalized);
    if (existing) {
      return res.status(409).json({ message: 'Area System already exists.' });
    }

    const created = await AreaSystem.create({ name: normalized });
    req.app.get('io').emit('DATA_UPDATED', { module: 'area-systems', action: 'create' });
    res.status(201).json(created);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteAreaSystem = async (req, res) => {
  try {
    const { name } = req.params;
    const item = await AreaSystem.findByPk(name);
    if (!item) {
      return res.status(404).json({ message: 'Area System not found.' });
    }
    await item.destroy();
    req.app.get('io').emit('DATA_UPDATED', { module: 'area-systems', action: 'delete' });
    res.status(200).json({ message: 'Deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
