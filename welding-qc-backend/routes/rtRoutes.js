const express = require('express');
const router = express.Router();
const rtController = require('../controllers/rtController');
const rtSubmissionController = require('../controllers/rtSubmissionController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

// Batch Submissions routes
router.post('/submit', requireRole(1), rtSubmissionController.submitRtBatch);
router.get('/submissions', rtSubmissionController.getAllSubmissions);
router.get('/submissions/:batch_id/pdf', rtSubmissionController.downloadPdf);

router.get('/', rtController.getAllRtAttempts);
// Supervisor uploads RT
router.post('/:unique_code', requireRole(1), rtController.uploadRt);
// Supervisor updates RT inline
router.put('/:attempt_id', requireRole(1), rtController.updateRtAttempt);
// Supervisor increments RT attempt
router.post('/:unique_code/increment', requireRole(1), rtController.incrementAttempt);
// Verifier/Admin checks RT
router.put('/:attempt_id/verify', rtController.verifyRt);

module.exports = router;
