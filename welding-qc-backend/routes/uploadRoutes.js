const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');

const { verifyToken } = require('../middleware/authMiddleware');

// Define the file upload route. The field name is 'file'.
// You can pass the module name in query params: POST /api/upload?module=rt
router.post('/', verifyToken, uploadController.uploadMiddleware, uploadController.handleUpload);

module.exports = router;
