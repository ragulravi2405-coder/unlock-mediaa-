const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { checkoutLimiter } = require('../middleware/rateLimiters');

// Create order
router.post('/create-order', checkoutLimiter, paymentController.createOrder);

// Verify payment signature
router.post('/verify', checkoutLimiter, paymentController.verifyPayment);

// Webhook endpoint (rawBody is provided by Express in server.js)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
