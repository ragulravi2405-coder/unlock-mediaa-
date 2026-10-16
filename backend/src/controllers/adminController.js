const Admin = require('../models/Admin');
const Media = require('../models/Media');
const Order = require('../models/Order');
const Purchase = require('../models/Purchase');
const ContactMessage = require('../models/ContactMessage');
const jwt = require('jsonwebtoken');
const path = require('path');
const fs = require('fs');
const { resolveFilePath } = require('../services/storageService');

const JWT_SECRET = process.env.JWT_SECRET || 'pay_unlock_secure_jwt_secret_dev';

/**
 * POST /api/admin/auth/login
 */
exports.adminLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Please enter both email and password' });
    }

    const admin = await Admin.findOne({ email: email.toLowerCase().trim() }).select('+password');
    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    // Update last login
    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign(
      { id: admin._id, email: admin.email, role: admin.role },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    return res.json({
      success: true,
      token,
      admin: {
        id: admin._id,
        email: admin.email,
        name: admin.name
      }
    });
  } catch (err) {
    console.error('[Admin Login Error]', err);
    return res.status(500).json({ error: 'Authentication failed' });
  }
};

/**
 * GET /api/admin/dashboard/stats
 */
exports.getDashboardStats = async (req, res) => {
  try {
    const [
      totalOrders,
      paidOrders,
      totalMedia,
      photosCount,
      videosCount,
      unreadMessages,
      recentOrders
    ] = await Promise.all([
      Order.countDocuments(),
      Order.find({ status: 'paid' }),
      Media.countDocuments(),
      Media.countDocuments({ mediaType: 'photo' }),
      Media.countDocuments({ mediaType: 'video' }),
      ContactMessage.countDocuments({ status: 'unread' }),
      Order.find().sort({ createdAt: -1 }).limit(8).populate('mediaId', 'title mediaType price previewUrl')
    ]);

    const totalRevenue = paidOrders.reduce((sum, o) => sum + (o.amount / 100), 0);

    return res.json({
      success: true,
      stats: {
        totalRevenue,
        paidOrdersCount: paidOrders.length,
        totalOrdersCount: totalOrders,
        totalMedia,
        photosCount,
        videosCount,
        unreadMessages
      },
      recentOrders
    });
  } catch (err) {
    console.error('[Admin Stats Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve stats' });
  }
};

/**
 * GET /api/admin/media
 */
exports.getAdminMediaList = async (req, res) => {
  try {
    const media = await Media.find()
      .select('+originalFileKey +originalFileName')
      .sort({ createdAt: -1 });

    return res.json({ success: true, data: media });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve media list' });
  }
};

/**
 * POST /api/admin/media
 * Upload preview and protected original file, or provide hosted URLs
 */
exports.createMedia = async (req, res) => {
  try {
    const {
      title,
      description,
      mediaType,
      category = 'General',
      tags = '',
      price = 99,
      allowDownload = true,
      isPublished = true,
      previewUrl: bodyPreviewUrl,
      originalFileKey: bodyOriginalFileKey
    } = req.body;

    if (!title || !mediaType) {
      return res.status(400).json({ error: 'Title and media type are required' });
    }

    let finalPreviewUrl = bodyPreviewUrl;
    let finalOriginalFileKey = bodyOriginalFileKey;
    let originalFileName = 'original_media';
    let mimeType = mediaType === 'video' ? 'video/mp4' : 'image/jpeg';
    let fileSize = 0;

    // Check files uploaded through multer
    if (req.files) {
      if (req.files.previewFile && req.files.previewFile[0]) {
        const file = req.files.previewFile[0];
        finalPreviewUrl = `/uploads/previews/${file.filename}`;
      }
      if (req.files.originalFile && req.files.originalFile[0]) {
        const file = req.files.originalFile[0];
        finalOriginalFileKey = file.filename;
        originalFileName = file.originalname;
        mimeType = file.mimetype;
        fileSize = file.size;
      }
    }

    if (!finalPreviewUrl || !finalOriginalFileKey) {
      return res.status(400).json({
        error: 'Both a preview file/URL and a protected original file/key are required'
      });
    }

    // Generate unique slug
    let baseSlug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    let slug = baseSlug || `item-${Date.now()}`;
    const slugExists = await Media.findOne({ slug });
    if (slugExists) {
      slug = `${slug}-${Date.now().toString().slice(-4)}`;
    }

    const tagList = Array.isArray(tags)
      ? tags
      : tags.split(',').map(t => t.trim()).filter(Boolean);

    const media = await Media.create({
      title: title.trim(),
      slug,
      description: (description || '').trim(),
      mediaType,
      category: category.trim(),
      tags: tagList,
      price: Number(price) || 99,
      previewUrl: finalPreviewUrl,
      originalFileKey: finalOriginalFileKey,
      originalFileName,
      mimeType,
      fileSize,
      allowDownload: allowDownload === 'true' || allowDownload === true,
      isPublished: isPublished === 'true' || isPublished === true
    });

    return res.status(201).json({ success: true, data: media });
  } catch (err) {
    console.error('[Create Media Error]', err);
    return res.status(500).json({ error: 'Failed to create media item: ' + err.message });
  }
};

/**
 * PUT /api/admin/media/:id
 */
exports.updateMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = { ...req.body };

    if (updates.tags && typeof updates.tags === 'string') {
      updates.tags = updates.tags.split(',').map(t => t.trim()).filter(Boolean);
    }

    if (updates.price) {
      updates.price = Number(updates.price);
    }

    const media = await Media.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    return res.json({ success: true, data: media });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to update media item' });
  }
};

/**
 * DELETE /api/admin/media/:id
 */
exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id).select('+originalFileKey');
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Try deleting local files if stored locally
    if (media.originalFileKey) {
      const originalPath = resolveFilePath(media.originalFileKey, true);
      if (fs.existsSync(originalPath)) {
        try { fs.unlinkSync(originalPath); } catch (e) {}
      }
    }

    await Media.findByIdAndDelete(id);
    return res.json({ success: true, message: 'Media deleted successfully' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to delete media item' });
  }
};

/**
 * GET /api/admin/orders
 */
exports.getOrdersList = async (req, res) => {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status && status !== 'all') {
      query.status = status;
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.max(1, parseInt(limit, 10));
    const skip = (pageNum - 1) * limitNum;

    const [orders, total] = await Promise.all([
      Order.find(query)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum)
        .populate('mediaId', 'title mediaType price')
        .lean(),
      Order.countDocuments(query)
    ]);

    // Attach purchase recovery codes where applicable
    const orderIds = orders.map(o => o.orderId);
    const purchases = await Purchase.find({ orderId: { $in: orderIds } }).lean();
    const purchaseMap = {};
    purchases.forEach(p => {
      purchaseMap[p.orderId] = p;
    });

    const enrichedOrders = orders.map(o => ({
      ...o,
      purchase: purchaseMap[o.orderId] || null
    }));

    return res.json({
      success: true,
      orders: enrichedOrders,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum)
      }
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to retrieve orders list' });
  }
};

/**
 * POST /api/admin/orders/:id/refund
 */
exports.refundOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    order.status = 'refunded';
    await order.save();

    // Revoke purchase entitlement
    await Purchase.updateMany({ orderId: order.orderId }, { status: 'refunded' });

    return res.json({ success: true, message: 'Order marked as refunded and access revoked' });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to refund order' });
  }
};
