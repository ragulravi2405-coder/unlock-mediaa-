const Media = require('../models/Media');
const Purchase = require('../models/Purchase');
const { hashToken, generateSignedMediaToken, verifySignedMediaToken } = require('../services/tokenService');
const { streamProtectedMedia, resolveFilePath } = require('../services/storageService');
const path = require('path');
const fs = require('fs');

/**
 * GET /api/media
 * Public gallery browsing with pagination, type filter, search and category
 */
exports.getPublicMediaList = async (req, res) => {
  try {
    const {
      type,
      category,
      search,
      sort = 'newest',
      page = 1,
      limit = 12
    } = req.query;

    const query = { isPublished: true };

    if (type && ['photo', 'video'].includes(type)) {
      query.mediaType = type;
    }

    if (category && category !== 'All') {
      query.category = category;
    }

    if (search && search.trim()) {
      query.$text = { $search: search.trim() };
    }

    let sortOptions = { createdAt: -1 };
    if (sort === 'popular') {
      sortOptions = { unlockCount: -1, viewsCount: -1 };
    } else if (sort === 'price-low') {
      sortOptions = { price: 1 };
    } else if (sort === 'price-high') {
      sortOptions = { price: -1 };
    }

    const pageNum = Math.max(1, parseInt(page, 10));
    const limitNum = Math.min(50, Math.max(1, parseInt(limit, 10)));
    const skip = (pageNum - 1) * limitNum;

    // Explicitly exclude originalFileKey and originalFileName from public response!
    const [mediaItems, total] = await Promise.all([
      Media.find(query)
        .select('-originalFileKey -originalFileName')
        .sort(sortOptions)
        .skip(skip)
        .limit(limitNum)
        .lean(),
      Media.countDocuments(query)
    ]);

    // Get unique categories for filtering
    const categories = await Media.distinct('category', { isPublished: true });

    return res.json({
      success: true,
      data: mediaItems,
      pagination: {
        total,
        page: pageNum,
        pages: Math.ceil(total / limitNum),
        limit: limitNum
      },
      categories: ['All', ...categories.filter(Boolean)]
    });
  } catch (err) {
    console.error('[Get Media List Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve media gallery' });
  }
};

/**
 * GET /api/media/:idOrSlug
 * Single public media details
 */
exports.getPublicMediaById = async (req, res) => {
  try {
    const { id } = req.params;
    let media;

    if (id.match(/^[0-9a-fA-F]{24}$/)) {
      media = await Media.findOne({ _id: id, isPublished: true })
        .select('-originalFileKey -originalFileName');
    } else {
      media = await Media.findOne({ slug: id, isPublished: true })
        .select('-originalFileKey -originalFileName');
    }

    if (!media) {
      return res.status(404).json({ error: 'Media item not found or unpublished' });
    }

    // Increment views asynchronously
    Media.findByIdAndUpdate(media._id, { $inc: { viewsCount: 1 } }).exec();

    return res.json({
      success: true,
      data: media
    });
  } catch (err) {
    console.error('[Get Media Error]', err);
    return res.status(500).json({ error: 'Failed to retrieve media item' });
  }
};

/**
 * GET /api/media/:id/preview
 * Direct streaming or redirection of public preview thumbnail or clip
 */
exports.getMediaPreview = async (req, res) => {
  try {
    const { id } = req.params;
    const media = await Media.findById(id).select('previewUrl mimeType');
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // If preview is a relative uploaded file
    if (media.previewUrl.startsWith('/uploads/previews/')) {
      const fileName = path.basename(media.previewUrl);
      const filePath = resolveFilePath(fileName, false);
      if (fs.existsSync(filePath)) {
        return res.sendFile(filePath);
      }
    }

    // Otherwise redirect to preview URL (e.g. CDN or absolute path)
    return res.redirect(media.previewUrl);
  } catch (err) {
    return res.status(500).json({ error: 'Failed to serve preview' });
  }
};

/**
 * POST /api/media/:id/access
 * Validates purchase token or recovery code and generates a short-lived signed streaming token
 */
exports.requestProtectedAccess = async (req, res) => {
  try {
    const { id } = req.params;
    const { purchaseToken, recoveryCode } = req.body;

    if (!purchaseToken && !recoveryCode) {
      return res.status(400).json({ error: 'Purchase token or recovery code required' });
    }

    let purchase = null;

    if (purchaseToken) {
      const tokenHash = hashToken(purchaseToken);
      purchase = await Purchase.findOne({
        purchaseTokenHash: tokenHash,
        mediaId: id,
        status: 'active'
      });
    } else if (recoveryCode) {
      purchase = await Purchase.findOne({
        recoveryCode: recoveryCode.trim().toUpperCase(),
        mediaId: id,
        status: 'active'
      });
    }

    if (!purchase) {
      return res.status(403).json({
        error: 'Unauthorized: This media has not been unlocked with the provided credentials',
        unlocked: false
      });
    }

    // Update access statistics
    purchase.accessCount += 1;
    purchase.lastAccessedAt = new Date();
    await purchase.save();

    // Generate short-lived signed media token (valid for 10 minutes)
    const { token: signedToken, expiresAt } = generateSignedMediaToken(id, purchase._id.toString(), 600);

    const streamUrl = `/api/protected-media/${id}?token=${signedToken}`;
    const downloadUrl = `/api/protected-media/${id}?token=${signedToken}&download=true`;

    return res.json({
      success: true,
      unlocked: true,
      signedToken,
      expiresAt,
      streamUrl,
      downloadUrl,
      purchase: {
        recoveryCode: purchase.recoveryCode,
        unlockedAt: purchase.createdAt
      }
    });
  } catch (err) {
    console.error('[Protected Access Request Error]', err);
    return res.status(500).json({ error: 'Failed to authorize media access' });
  }
};

/**
 * GET /api/protected-media/:id
 * Server-side protected streaming of original photo or video with Range headers
 */
exports.streamProtectedMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const { token, download } = req.query;

    if (!token) {
      return res.status(401).json({ error: 'Missing signed media access token' });
    }

    const verified = verifySignedMediaToken(token);
    if (!verified || verified.mediaId !== id) {
      return res.status(403).json({ error: 'Media access token has expired or is invalid. Please refresh the page.' });
    }

    // Retrieve media including originalFileKey
    const media = await Media.findById(id).select('+originalFileKey +originalFileName');
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    const isDownload = download === 'true' && media.allowDownload;
    const filename = media.originalFileName || `${media.slug}.${media.mediaType === 'video' ? 'mp4' : 'jpg'}`;

    return streamProtectedMedia(req, res, media.originalFileKey, media.mimeType, isDownload, filename);
  } catch (err) {
    console.error('[Stream Protected Media Error]', err);
    return res.status(500).json({ error: 'Failed to stream protected media' });
  }
};
