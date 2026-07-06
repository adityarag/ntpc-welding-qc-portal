const bcrypt = require('bcryptjs');
const { User } = require('../models');

exports.getAllUsers = async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password_hash'] } });
    res.status(200).json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.createUser = async (req, res) => {
  try {
    const { username, password, role } = req.body;
    const password_hash = await bcrypt.hash(password, 10);
    const newUser = await User.create({ username, password_hash, role });
    
    // Don't send hash back
    const userJson = newUser.toJSON();
    delete userJson.password_hash;
    
    req.app.get('io').emit('DATA_UPDATED', { module: 'users', action: 'create' });
    res.status(201).json(userJson);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    const password_hash = await bcrypt.hash(newPassword, 10);
    await user.update({ password_hash });
    
    req.app.get('io').emit('DATA_UPDATED', { module: 'users', action: 'update' });
    res.status(200).json({ message: 'Password reset successful.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findByPk(id);
    if (!user) return res.status(404).json({ message: 'User not found.' });

    await user.destroy();
    req.app.get('io').emit('DATA_UPDATED', { module: 'users', action: 'delete' });
    res.status(200).json({ message: 'User deleted successfully.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
