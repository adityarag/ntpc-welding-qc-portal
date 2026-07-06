const express = require('express');
const router = express.Router();
const welderController = require('../controllers/welderController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', welderController.getAllWelders);
router.post('/', requireRole(3), welderController.createWelder);
router.put('/:id', requireRole(3), welderController.updateWelder);

module.exports = router;
