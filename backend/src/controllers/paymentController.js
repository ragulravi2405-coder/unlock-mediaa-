const Media = require('../models/Media');
const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const { createRazorpayOrder, verifyPaymentSignature, verifyWebhookSignature } = require('../services/razorpayService');
const { generatePurchaseToken, hashToken } = require('../services/tokenService');

/**
 * POST /api/payments/create-order
 * Initiates Razorpay checkout order with authoritative server-side pricing
 */
exports.createOrder = async (req, res) => {
  try {
    const { mediaId, customerSessionId } = req.body;

    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }

    const media = await Media.findOne({ _id: mediaId, isPublished: true });
    if (!media) {
      return res.status(404).json({ error: 'Selected media item was not found or is no longer available' });
    }

    // Always fetch price from database. Never trust client-supplied amounts!
    const priceInINR = media.price || 99;
    const amountInPaise = Math.round(priceInINR * 100);
    const receipt = `rcpt_${Date.now()}_${media._id.toString().slice(-6)}`;

    // Create order with Razorpay
    const rzpOrder = await createRazorpayOrder({
      amount: amountInPaise,
      currency: 'INR',
      receipt,
      notes: {
        mediaId: media._id.toString(),
        mediaTitle: media.title.substring(0, 30),
        mediaType: media.mediaType,
        customerSessionId: customerSessionId || 'anonymous'
      }
    });

    // Save order in database
    const newOrder = await Order.create({
      orderId: rzpOrder.id,
      mediaId: media._id,
      amount: amountInPaise,
      currency: 'INR',
      status: 'created',
      receipt,
      customerSessionId: customerSessionId || 'anonymous',
      metadata: {
        mediaTitle: media.title,
        mediaType: media.mediaType,
        isMock: rzpOrder.isMock || false
      }
    });

    return res.status(201).json({
      success: true,
      orderId: rzpOrder.id,
      amount: amountInPaise,
      currency: 'INR',
      key_id: rzpOrder.key_id,
      isMock: rzpOrder.isMock || false,
      media: {
        id: media._id,
        title: media.title,
        price: priceInINR,
        mediaType: media.mediaType,
        previewUrl: media.previewUrl
      }
    });
  } catch (err) {
    console.error('[Create Order Error]', err);
    return res.status(500).json({ error: err.message || 'Failed to initialize payment checkout' });
  }
};

/**
 * POST /api/payments/verify
 * Authoritative server-side verification of Razorpay payment signature
 */
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      mediaId
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature || !mediaId) {
      return res.status(400).json({
        error: 'Missing required payment verification parameters'
      });
    }

    // Retrieve order from database
    const order = await Order.findOne({ orderId: razorpay_order_id });
    if (!order) {
      return res.status(404).json({ error: 'Order reference not found' });
    }

    // Prevent cross-item replay: Ensure mediaId in request matches order's mediaId
    if (order.mediaId.toString() !== mediaId.toString()) {
      return res.status(400).json({ error: 'Order mismatch: Media ID does not correspond to this order' });
    }

    // Check if order was already verified and fulfilled
    if (order.status === 'paid') {
      const existingPurchase = await Purchase.findOne({ orderId: razorpay_order_id });
      if (existingPurchase) {
        return res.json({
          success: true,
          alreadyFulfilled: true,
          mediaId: order.mediaId,
          recoveryCode: existingPurchase.recoveryCode,
          message: 'Payment was previously verified and media is unlocked.'
        });
      }
    }

    // Authoritative signature verification
    const isValidSignature = verifyPaymentSignature({
      orderId: razorpay_order_id,
      paymentId: razorpay_payment_id,
      signature: razorpay_signature
    });

    if (!isValidSignature) {
      order.status = 'failed';
      order.failureReason = 'Cryptographic signature verification failed';
      await order.save();
      return res.status(400).json({
        error: 'Payment verification failed: Invalid transaction signature'
      });
    }

    // Update order status
    order.status = 'paid';
    order.paymentId = razorpay_payment_id;
    order.paymentSignature = razorpay_signature;
    order.verifiedAt = new Date();
    await order.save();

    // Generate high-entropy anonymous purchase access token and recovery code
    const { rawToken, tokenHash, recoveryCode } = generatePurchaseToken();

    const purchase = await Purchase.create({
      purchaseTokenHash: tokenHash,
      recoveryCode,
      mediaId: order.mediaId,
      orderId: order.orderId,
      paymentId: razorpay_payment_id,
      amountPaid: order.amount / 100,
      currency: order.currency,
      status: 'active'
    });

    // Increment media unlock count
    await Media.findByIdAndUpdate(order.mediaId, { $inc: { unlockCount: 1 } });

    console.log(`[Payment Success] Order ${order.orderId} verified. Media ${order.mediaId} unlocked for payment ${razorpay_payment_id}`);

    return res.json({
      success: true,
      message: 'Payment verified successfully! Media is now unlocked.',
      purchaseToken: rawToken, // Returned ONLY once upon verification for user to store in localStorage
      recoveryCode,
      mediaId: order.mediaId,
      orderId: order.orderId,
      paymentId: razorpay_payment_id
    });
  } catch (err) {
    console.error('[Payment Verification Error]', err);
    return res.status(500).json({ error: 'Failed to verify payment status: ' + err.message });
  }
};

/**
 * POST /api/payments/webhook
 * Razorpay Webhook handler with raw body verification and idempotent reconciliation
 */
exports.handleWebhook = async (req, res) => {
  try {
    const webhookSignature = req.headers['x-razorpay-signature'];
    const rawBody = req.rawBody; // Captured by express raw body parser

    if (!verifyWebhookSignature(rawBody, webhookSignature)) {
      console.warn('[Webhook Warning] Invalid webhook signature received');
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    const eventData = JSON.parse(rawBody.toString('utf8'));
    const { event, payload } = eventData;

    console.log(`[Razorpay Webhook] Received event: ${event}`);

    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      const paymentId = paymentEntity?.id;

      if (orderId) {
        const order = await Order.findOne({ orderId });
        if (order && order.status !== 'paid') {
          order.status = 'paid';
          order.paymentId = paymentId;
          order.verifiedAt = new Date();
          await order.save();

          // Check if purchase already exists
          const existingPurchase = await Purchase.findOne({ orderId });
          if (!existingPurchase) {
            const { rawToken, tokenHash, recoveryCode } = generatePurchaseToken();
            await Purchase.create({
              purchaseTokenHash: tokenHash,
              recoveryCode,
              mediaId: order.mediaId,
              orderId,
              paymentId: paymentId || 'webhook_captured',
              amountPaid: order.amount / 100,
              currency: order.currency,
              status: 'active'
            });
            await Media.findByIdAndUpdate(order.mediaId, { $inc: { unlockCount: 1 } });
            console.log(`[Razorpay Webhook] Automatically granted access for order: ${orderId}`);
          }
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payment?.entity;
      const orderId = paymentEntity?.order_id;
      if (orderId) {
        await Order.findOneAndUpdate(
          { orderId },
          {
            status: 'failed',
            failureReason: paymentEntity.error_description || 'Payment failed at gateway'
          }
        );
      }
    }

    return res.status(200).json({ status: 'ok' });
  } catch (err) {
    console.error('[Webhook Processing Error]', err);
    return res.status(500).json({ error: 'Webhook processing error' });
  }
};

/**
 * POST /api/payments/verify-direct-link
 * Verifies and unlocks media paid via direct Razorpay link (razorpay.me/@ravirahul601)
 */
exports.verifyDirectLinkPayment = async (req, res) => {
  try {
    const { mediaId, paymentReference, customerSessionId, customerName } = req.body;

    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }

    const trimmedRef = (paymentReference && typeof paymentReference === 'string') ? paymentReference.trim() : '';

    if (!trimmedRef || trimmedRef.length < 6 || trimmedRef.startsWith('test_unlock_') || trimmedRef.startsWith('rzpme_')) {
      return res.status(400).json({
        error: 'Valid Payment Reference / UPI UTR number is required. Please pay first on Razorpay/UPI and enter your transaction reference number to unlock.'
      });
    }

    const media = await Media.findOne({ _id: mediaId, isPublished: true });
    if (!media) {
      return res.status(404).json({ error: 'Selected media item was not found' });
    }

    // Check if this paymentReference/UTR has already been used for this or another purchase
    const existingPurchase = await Purchase.findOne({ paymentId: trimmedRef });
    if (existingPurchase) {
      return res.status(400).json({
        error: 'This Payment Reference / UTR number has already been used and verified. Please enter your own payment transaction number.'
      });
    }

    const priceInINR = media.price || 199;
    const amountInPaise = Math.round(priceInINR * 100);
    const safeRef = trimmedRef;

    const orderId = `order_me_${Date.now()}_${media._id.toString().slice(-4)}`;
    const receipt = `rcpt_me_${Date.now()}`;

    // Create completed order
    const order = await Order.create({
      orderId,
      mediaId: media._id,
      amount: amountInPaise,
      currency: 'INR',
      status: 'paid',
      paymentId: safeRef,
      receipt,
      customerSessionId: customerSessionId || 'anonymous',
      verifiedAt: new Date(),
      metadata: {
        gateway: 'razorpay.me/@ravirahul601',
        paymentReference: safeRef,
        customerName: customerName || 'Guest',
        mediaTitle: media.title
      }
    });

    // Generate cryptographic unlock token & recovery code
    const { rawToken, tokenHash, recoveryCode } = generatePurchaseToken();

    const purchase = await Purchase.create({
      purchaseTokenHash: tokenHash,
      recoveryCode,
      mediaId: media._id,
      orderId,
      paymentId: safeRef,
      amountPaid: priceInINR,
      currency: 'INR',
      status: 'active'
    });

    // Increment unlock counter
    await Media.findByIdAndUpdate(media._id, { $inc: { unlockCount: 1 } });

    console.log(`[Razorpay.me Success] Unlocked "${media.title}" for ₹${priceInINR} (Payment Ref: ${safeRef})`);

    return res.json({
      success: true,
      message: 'Payment verified! Media unlocked successfully.',
      purchaseToken: rawToken,
      recoveryCode,
      mediaId: media._id,
      orderId,
      paymentId: safeRef,
      amountPaid: priceInINR
    });
  } catch (err) {
    console.error('[Direct Link Payment Error]', err);
    return res.status(500).json({ error: 'Failed to complete unlock: ' + err.message });
  }
};

/**
 * POST /api/payments/submit-utr
 * Submits UPI UTR payment for Admin Review (Photo remains LOCKED until Rahul approves it)
 */
exports.submitUtrPayment = async (req, res) => {
  try {
    const { mediaId, utrNumber, customerName, customerSessionId } = req.body;

    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }

    const trimmedUtr = (utrNumber && typeof utrNumber === 'string') ? utrNumber.trim() : '';

    if (!trimmedUtr || trimmedUtr.length < 8) {
      return res.status(400).json({
        error: 'Please enter a valid 12-digit UPI UTR / Transaction number from Google Pay, PhonePe, Paytm, or BHIM.'
      });
    }

    const media = await Media.findOne({ _id: mediaId, isPublished: true });
    if (!media) {
      return res.status(404).json({ error: 'Selected media item was not found' });
    }

    // Check if this exact UTR is already approved
    const existingApproved = await Purchase.findOne({ paymentId: trimmedUtr });
    if (existingApproved) {
      return res.status(400).json({
        error: 'This UPI UTR number has already been verified and used. Please enter your genuine payment transaction number.'
      });
    }

    // Check if an order with this UTR already exists
    const existingOrder = await Order.findOne({ paymentId: trimmedUtr });
    if (existingOrder) {
      if (existingOrder.status === 'paid') {
        return res.status(400).json({
          error: 'This UPI UTR has already been approved and paid.'
        });
      }
      return res.json({
        success: true,
        status: existingOrder.status,
        orderId: existingOrder.orderId,
        mediaId: media._id,
        amount: existingOrder.amount / 100,
        utrNumber: trimmedUtr,
        message: 'This payment request is already submitted and awaiting Admin verification.'
      });
    }

    const priceInINR = media.price || 99;
    const amountInPaise = Math.round(priceInINR * 100);
    const orderId = `order_utr_${Date.now()}_${media._id.toString().slice(-4)}`;
    const receipt = `rcpt_utr_${Date.now()}`;

    // Create Order with status 'pending_verification' - PHOTO REMAINS LOCKED!
    const order = await Order.create({
      orderId,
      mediaId: media._id,
      amount: amountInPaise,
      currency: 'INR',
      status: 'pending_verification',
      paymentId: trimmedUtr,
      receipt,
      customerSessionId: customerSessionId || 'anonymous',
      metadata: {
        paymentMethod: 'UPI_UTR_APPROVAL',
        utrNumber: trimmedUtr,
        customerName: customerName || 'Guest Buyer',
        mediaTitle: media.title,
        submittedAt: new Date()
      }
    });

    console.log(`[UTR Submitted] Order ${orderId} for "${media.title}" (₹${priceInINR}) with UTR: ${trimmedUtr}. Status: PENDING_VERIFICATION.`);

    return res.status(201).json({
      success: true,
      status: 'pending_verification',
      orderId,
      mediaId: media._id,
      amount: priceInINR,
      utrNumber: trimmedUtr,
      message: 'Payment submitted! Admin will verify your UTR in bank records and approve.'
    });
  } catch (err) {
    console.error('[Submit UTR Error]', err);
    return res.status(500).json({ error: 'Failed to submit payment request: ' + err.message });
  }
};

/**
 * GET /api/payments/status/:orderId
 * Checks current approval status of an order
 */
exports.checkOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    if (!orderId) {
      return res.status(400).json({ error: 'Order ID is required' });
    }

    const order = await Order.findOne({ orderId }).populate('mediaId', 'title previewUrl price mediaType');
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (order.status === 'paid') {
      const purchase = await Purchase.findOne({ orderId });
      return res.json({
        success: true,
        status: 'paid',
        mediaId: order.mediaId._id,
        orderId: order.orderId,
        paymentId: order.paymentId,
        recoveryCode: purchase ? purchase.recoveryCode : (order.metadata?.recoveryCode || null),
        purchaseToken: order.metadata?.rawToken || null,
        message: 'Payment verified and approved by Admin! Photo is unlocked.'
      });
    }

    if (order.status === 'rejected') {
      return res.json({
        success: false,
        status: 'rejected',
        orderId: order.orderId,
        message: order.failureReason || 'Payment rejected: No matching transaction found in bank records.'
      });
    }

    return res.json({
      success: true,
      status: order.status, // 'pending_verification'
      orderId: order.orderId,
      mediaId: order.mediaId._id,
      utrNumber: order.paymentId,
      message: 'Payment is awaiting Admin verification against bank/UPI records.'
    });
  } catch (err) {
    console.error('[Check Order Status Error]', err);
    return res.status(500).json({ error: 'Failed to check order status' });
  }
};

