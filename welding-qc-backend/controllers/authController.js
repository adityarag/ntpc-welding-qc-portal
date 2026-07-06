const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { User } = require('../models');

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ where: { username } });

    if (!user) {
      return res.status(404).json({ message: 'User Not found.' });
    }

    const passwordIsValid = bcrypt.compareSync(password, user.password_hash);

    if (!passwordIsValid) {
      return res.status(401).json({
        accessToken: null,
        message: 'Invalid Password!'
      });
    }

    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, {
      expiresIn: 86400 // 24 hours
    });

    res.status(200).json({
      id: user.id,
      username: user.username,
      role: user.role,
      accessToken: token
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Seed initial user for testing (since there's no registration UI)
exports.seedUser = async (req, res) => {
  try {
    const userCount = await User.count();
    if (userCount === 0) {
      const password_hash = bcrypt.hashSync('password123', 8);
      await User.bulkCreate([
        { username: 'admin', password_hash, role: 3 },
        { username: 'verifier', password_hash, role: 2 },
        { username: 'supervisor', password_hash, role: 1 }
      ]);
      return res.status(201).json({ message: 'Users seeded successfully!' });
    }
    res.status(200).json({ message: 'Users already seeded.' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
