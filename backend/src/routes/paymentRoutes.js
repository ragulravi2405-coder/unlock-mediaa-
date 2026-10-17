const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');
const { checkoutLimiter } = require('../middleware/rateLimiters');

// Create order
router.post('/create-order', checkoutLimiter, paymentController.createOrder);

// Verify payment signature
router.post('/verify', checkoutLimiter, paymentController.verifyPayment);

// Submit UPI UTR for Admin approval
router.post('/submit-utr', checkoutLimiter, paymentController.submitUtrPayment);

// Poll or check status of an order
router.get('/status/:orderId', paymentController.checkOrderStatus);

// Verify direct payment via Razorpay.me link (@ravirahul601)
router.post('/verify-direct-link', checkoutLimiter, paymentController.verifyDirectLinkPayment);

// Webhook endpoint (rawBody is provided by Express in server.js)
router.post('/webhook', paymentController.handleWebhook);

module.exports = router;
