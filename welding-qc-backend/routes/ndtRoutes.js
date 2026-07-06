const express = require('express');
const router = express.Router();
const ndtController = require('../controllers/ndtController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/:type', ndtController.getNdtRecordsByType);
router.post('/:type', requireRole(1), ndtController.createNdtRecord);
router.put('/:id', requireRole(2), ndtController.updateNdtRecord);
router.post('/:id/increment', requireRole(2), ndtController.incrementAttempt);

module.exports = router;
