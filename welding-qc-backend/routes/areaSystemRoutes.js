const express = require('express');
const router = express.Router();
const areaSystemController = require('../controllers/areaSystemController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

const allowAdminOrSupervisor = (req, res, next) => {
  if (req.userRole !== 1 && req.userRole !== 3) {
    return res.status(403).json({ message: 'Require Admin or Supervisor role!' });
  }
  next();
};

router.get('/', areaSystemController.getAllAreaSystems);
router.post('/', allowAdminOrSupervisor, areaSystemController.createAreaSystem);
router.delete('/:name', allowAdminOrSupervisor, areaSystemController.deleteAreaSystem);

module.exports = router;
