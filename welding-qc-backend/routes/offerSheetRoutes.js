const express = require('express');
const router = express.Router();
const offerSheetController = require('../controllers/offerSheetController');
const { verifyToken, requireRole } = require('../middleware/authMiddleware');

router.use(verifyToken);

router.get('/', offerSheetController.getAllOfferSheets);
router.get('/:offer_sheet_id', offerSheetController.getOfferSheetById);
router.post('/', requireRole(3), offerSheetController.createOfferSheet);
router.put('/:offer_sheet_id', offerSheetController.updateOfferSheet);

module.exports = router;
