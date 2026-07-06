const express = require('express');
const router = express.Router();
const jointController = require('../controllers/jointController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', jointController.getAllJoints);
router.get('/:offer_sheet_id', jointController.getJointsByOfferSheet);
// Supervisor creates joints (requireRole(1) covers Role 1, 2, 3)
router.post('/', requireRole(1), jointController.createJoint);
router.put('/:unique_code', requireRole(1), jointController.updateJoint);

module.exports = router;
