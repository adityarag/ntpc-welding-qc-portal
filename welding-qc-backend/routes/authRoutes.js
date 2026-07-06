const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');

const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.post('/login', authController.login);
router.post('/seed', [verifyToken, requireRole(3)], authController.seedUser);

module.exports = router;
