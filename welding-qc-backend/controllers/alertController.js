const { ActionAlert, OfferSheet } = require('../models');

exports.getAlerts = async (req, res) => {
  try {
    const alerts = await ActionAlert.findAll({
      where: { supervisor_id: req.userId, status: 'Unread' },
      order: [['createdAt', 'DESC']]
    });
    res.status(200).json(alerts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resolveAlert = async (req, res) => {
  try {
    const { id } = req.params;
    const alert = await ActionAlert.findByPk(id);
    if (!alert) return res.status(404).json({ message: 'Alert not found.' });

    // Ensure the user owns the alert, or is admin
    if (alert.supervisor_id !== req.userId && req.userRole !== 3) {
      return res.status(403).json({ message: 'Forbidden' });
    }

    await alert.update({ status: 'Resolved' });
    res.status(200).json(alert);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
