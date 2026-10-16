const express = require('express');
const router = express.Router();
const mediaController = require('../controllers/mediaController');
const { apiLimiter, recoveryLimiter } = require('../middleware/rateLimiters');

// Public endpoints
router.get('/', apiLimiter, mediaController.getPublicMediaList);
router.get('/:id', apiLimiter, mediaController.getPublicMediaById);
router.get('/:id/preview', apiLimiter, mediaController.getMediaPreview);

// Protected entitlement request (verifies purchase token/code)
router.post('/:id/access', recoveryLimiter, mediaController.requestProtectedAccess);

module.exports = router;
