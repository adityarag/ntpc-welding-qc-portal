const { Supervisor } = require('../models');

exports.getAllSupervisors = async (req, res) => {
  try {
    const supervisors = await Supervisor.findAll({ order: [['createdAt', 'DESC']] });
    res.status(200).json(supervisors);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createSupervisor = async (req, res) => {
  try {
    const supervisor = await Supervisor.create(req.body);
    req.app.get('io').emit('DATA_UPDATED', { module: 'supervisors', action: 'create' });
    res.status(201).json(supervisor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.updateSupervisor = async (req, res) => {
  try {
    const supervisor = await Supervisor.findByPk(req.params.id);
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found' });
    
    await supervisor.update(req.body);
    req.app.get('io').emit('DATA_UPDATED', { module: 'supervisors', action: 'update' });
    res.status(200).json(supervisor);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

exports.deleteSupervisor = async (req, res) => {
  try {
    const supervisor = await Supervisor.findByPk(req.params.id);
    if (!supervisor) return res.status(404).json({ message: 'Supervisor not found' });
    
    await supervisor.destroy();
    req.app.get('io').emit('DATA_UPDATED', { module: 'supervisors', action: 'delete' });
    res.status(204).send();
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
