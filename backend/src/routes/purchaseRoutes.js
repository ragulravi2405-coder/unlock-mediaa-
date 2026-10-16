const express = require('express');
const router = express.Router();
const purchaseController = require('../controllers/purchaseController');
const { recoveryLimiter } = require('../middleware/rateLimiters');

// Check status of a purchase for a specific media item
router.get('/status', purchaseController.checkPurchaseStatus);

// Recover access using code or order/payment ID
router.post('/recover', recoveryLimiter, purchaseController.recoverAccess);

// Anonymous library check (multiple tokens)
router.post('/my-library', recoveryLimiter, purchaseController.getMyLibrary);

module.exports = router;
