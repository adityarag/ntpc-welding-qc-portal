const express = require('express');
const router = express.Router();
const supervisorController = require('../controllers/supervisorController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/', [verifyToken], supervisorController.getAllSupervisors);
router.post('/', [verifyToken, requireRole(3)], supervisorController.createSupervisor);
router.put('/:id', [verifyToken, requireRole(3)], supervisorController.updateSupervisor);
router.delete('/:id', [verifyToken, requireRole(3)], supervisorController.deleteSupervisor);

module.exports = router;
