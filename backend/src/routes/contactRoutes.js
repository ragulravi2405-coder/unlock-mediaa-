const express = require('express');
const router = express.Router();
const contactController = require('../controllers/contactController');
const { contactLimiter } = require('../middleware/rateLimiters');
const { verifyAdminToken } = require('../middleware/auth');

// Public contact submission
router.post('/', contactLimiter, contactController.submitContactMessage);

// Admin view messages
router.get('/messages', verifyAdminToken, contactController.getMessages);

module.exports = router;
