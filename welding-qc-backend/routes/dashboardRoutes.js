const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.get('/kpi', [verifyToken, requireRole(3)], dashboardController.getDashboardKPIs);

module.exports = router;
