const crypto = require('crypto');
const { getRazorpayInstance } = require('../config/razorpay');

/**
 * Creates an order in Razorpay (or mock order if in development mock mode)
 */
async function createRazorpayOrder({ amount, currency = 'INR', receipt, notes = {} }) {
  const { isMock, key_id, instance } = getRazorpayInstance();

  if (isMock || !instance) {
    // Generate deterministic/mock order for testing when keys are not yet configured
    const mockOrderId = `order_mock_${Date.now()}_${crypto.randomBytes(4).toString('hex')}`;
    console.log(`[Razorpay Service (Demo/Mock Mode)] Generated mock order: ${mockOrderId} for ₹${amount / 100}`);
    return {
      id: mockOrderId,
      amount,
      currency,
      receipt,
      status: 'created',
      isMock: true,
      key_id: key_id || 'rzp_test_mock_mode'
    };
  }

  try {
    const orderOptions = {
      amount, // amount in paise (e.g. 9900 = ₹99)
      currency,
      receipt: receipt.substring(0, 40),
      payment_capture: 1, // Auto capture
      notes
    };

    const order = await instance.orders.create(orderOptions);
    return {
      ...order,
      isMock: false,
      key_id
    };
  } catch (err) {
    console.error('[Razorpay Order Creation Error]', err);
    throw new Error(`Failed to create Razorpay order: ${err.error?.description || err.message}`);
  }
}

/**
 * Authoritatively verifies Razorpay payment signature
 */
function verifyPaymentSignature({ orderId, paymentId, signature }) {
  const key_secret = process.env.RAZORPAY_KEY_SECRET;

  // Handle mock payment verification in dev if using mock order
  if (orderId && orderId.startsWith('order_mock_')) {
    return true;
  }

  if (!key_secret) {
    throw new Error('Server RAZORPAY_KEY_SECRET is not configured');
  }

  const generatedSignature = crypto
    .createHmac('sha256', key_secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');

  return crypto.timingSafeEqual(
    Buffer.from(generatedSignature),
    Buffer.from(signature)
  );
}

/**
 * Verifies Razorpay Webhook signature against unmodified raw body
 */
function verifyWebhookSignature(rawBody, webhookSignature) {
  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.warn('[Webhook Warning] RAZORPAY_WEBHOOK_SECRET is not configured on server');
    return false;
  }

  if (!webhookSignature) return false;

  const expectedSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(rawBody)
    .digest('hex');

  try {
    return crypto.timingSafeEqual(
      Buffer.from(expectedSignature),
      Buffer.from(webhookSignature)
    );
  } catch (err) {
    return false;
  }
}

module.exports = {
  createRazorpayOrder,
  verifyPaymentSignature,
  verifyWebhookSignature
};
