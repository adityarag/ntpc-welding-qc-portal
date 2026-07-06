const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
  const token = req.headers['authorization'];

  if (!token) {
    return res.status(403).json({ message: 'No token provided.' });
  }

  // usually "Bearer <token>"
  const parts = token.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return res.status(401).json({ message: 'Token format invalid.' });
  }

  jwt.verify(parts[1], process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(401).json({ message: 'Unauthorized!' });
    }
    req.userId = decoded.id;
    req.userRole = decoded.role;
    next();
  });
};

const requireRole = (minRole) => {
  return (req, res, next) => {
    if (req.userRole < minRole) {
      return res.status(403).json({ message: 'Require higher privileges!' });
    }
    next();
  };
};

module.exports = {
  verifyToken,
  requireRole
};
