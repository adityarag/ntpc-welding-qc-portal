const express = require('express');
const router = express.Router();
const weldController = require('../controllers/weldController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', weldController.getAllWelds);
router.get('/pwht-report', weldController.getPwhtExport);
// Supervisor updates PWHT details
router.put('/:joint_id', requireRole(1), weldController.updateWeld);
// Verifier/Admin verifies PWHT
router.put('/:joint_id/verify', requireRole(2), weldController.verifyWeld);

module.exports = router;
