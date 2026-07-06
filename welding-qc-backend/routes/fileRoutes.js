const express = require('express');
const router = express.Router();
const fileController = require('../controllers/fileController');
const { verifyToken } = require('../middleware/authMiddleware');

// Endpoint for downloading files securely
router.get('/download', verifyToken, fileController.downloadFile);

module.exports = router;
