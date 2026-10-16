const Purchase = require('../models/Purchase');
const Media = require('../models/Media');
const Order = require('../models/Order');
const { hashToken } = require('../services/tokenService');

/**
 * GET /api/purchases/status?mediaId=...&token=...
 * Checks if a specific media item is unlocked
 */
exports.checkPurchaseStatus = async (req, res) => {
  try {
    const { mediaId, token, code } = req.query;

    if (!mediaId) {
      return res.status(400).json({ error: 'Media ID is required' });
    }

    if (!token && !code) {
      return res.json({ unlocked: false });
    }

    let purchase = null;

    if (token) {
      const tokenHash = hashToken(token);
      purchase = await Purchase.findOne({
        purchaseTokenHash: tokenHash,
        mediaId,
        status: 'active'
      });
    }

    if (!purchase && code) {
      purchase = await Purchase.findOne({
        recoveryCode: code.trim().toUpperCase(),
        mediaId,
        status: 'active'
      });
    }

    if (!purchase) {
      return res.json({ unlocked: false });
    }

    return res.json({
      unlocked: true,
      mediaId,
      unlockedAt: purchase.createdAt,
      recoveryCode: purchase.recoveryCode
    });
  } catch (err) {
    console.error('[Purchase Status Error]', err);
    return res.status(500).json({ error: 'Failed to verify purchase status' });
  }
};

/**
 * POST /api/purchases/recover
 * Recovers access to media using a recovery code or order/payment ID
 */
exports.recoverAccess = async (req, res) => {
  try {
    const { recoveryCode, orderId, paymentId } = req.body;

    if (!recoveryCode && !orderId && !paymentId) {
      return res.status(400).json({
        error: 'Please enter a Recovery Code, Order ID, or Payment ID to locate your purchase.'
      });
    }

    let purchase = null;

    if (recoveryCode) {
      const cleanCode = recoveryCode.trim().toUpperCase();
      purchase = await Purchase.findOne({ recoveryCode: cleanCode, status: 'active' })
        .populate('mediaId', '-originalFileKey -originalFileName');
    } else if (orderId) {
      purchase = await Purchase.findOne({ orderId: orderId.trim(), status: 'active' })
        .populate('mediaId', '-originalFileKey -originalFileName');
    } else if (paymentId) {
      purchase = await Purchase.findOne({ paymentId: paymentId.trim(), status: 'active' })
        .populate('mediaId', '-originalFileKey -originalFileName');
    }

    if (!purchase || !purchase.mediaId) {
      return res.status(404).json({
        error: 'No active unlocked media was found matching those details. Please check your code or transaction reference.'
      });
    }

    // Return purchase record and media details
    return res.json({
      success: true,
      message: 'Purchase access found and verified!',
      media: purchase.mediaId,
      purchase: {
        recoveryCode: purchase.recoveryCode,
        orderId: purchase.orderId,
        paymentId: purchase.paymentId,
        amountPaid: purchase.amountPaid,
        unlockedAt: purchase.createdAt
      }
    });
  } catch (err) {
    console.error('[Recover Access Error]', err);
    return res.status(500).json({ error: 'Failed to recover media access' });
  }
};

/**
 * POST /api/purchases/my-library
 * Bulk lookup of multiple tokens saved in client anonymous localStorage
 */
exports.getMyLibrary = async (req, res) => {
  try {
    const { tokens = [], recoveryCodes = [] } = req.body;

    if ((!tokens || tokens.length === 0) && (!recoveryCodes || recoveryCodes.length === 0)) {
      return res.json({ success: true, items: [] });
    }

    const hashedTokens = tokens.map(t => hashToken(t)).filter(Boolean);
    const cleanedCodes = recoveryCodes.map(c => c.trim().toUpperCase()).filter(Boolean);

    const purchases = await Purchase.find({
      $or: [
        { purchaseTokenHash: { $in: hashedTokens } },
        { recoveryCode: { $in: cleanedCodes } }
      ],
      status: 'active'
    }).populate('mediaId', '-originalFileKey -originalFileName');

    const validItems = purchases
      .filter(p => p.mediaId && p.mediaId.isPublished)
      .map(p => ({
        purchaseId: p._id,
        recoveryCode: p.recoveryCode,
        unlockedAt: p.createdAt,
        media: p.mediaId
      }));

    return res.json({
      success: true,
      items: validItems
    });
  } catch (err) {
    console.error('[Get My Library Error]', err);
    return res.status(500).json({ error: 'Failed to load unlocked media library' });
  }
};
