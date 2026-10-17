const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const Media = require('../models/Media');
const { ORIGINALS_DIR, PREVIEWS_DIR } = require('./storageService');

// Source directory where user drops photos and videos
const IMAGES_SOURCE_DIR = path.resolve(__dirname, '../../../add_images_here');

// Allowed pricing pool between 99 and 149
const PRICE_TIERS = [99, 109, 119, 129, 139, 149];

// Allowed extensions
const VALID_IMAGE_EXTS = ['.jpg', '.jpeg', '.png', '.webp'];
const VALID_VIDEO_EXTS = ['.mp4', '.mov', '.webm'];
const VALID_EXTS = [...VALID_IMAGE_EXTS, ...VALID_VIDEO_EXTS];

/**
 * Ensures the source folder exists
 */
function ensureSourceDir() {
  if (!fs.existsSync(IMAGES_SOURCE_DIR)) {
    fs.mkdirSync(IMAGES_SOURCE_DIR, { recursive: true });
  }
}

/**
 * Extracts a clean title and detects price from filename
 * Example: "golden_temple_99.jpg" -> { title: "Golden Temple", price: 99 }
 */
function parseFileInfo(fileName, index = 0) {
  const ext = path.extname(fileName);
  let baseName = path.basename(fileName, ext);

  // Check if filename contains a price (e.g. _1, _99, _149)
  let price = null;
  const priceMatch = baseName.match(/(?:_|-|\s)?(\d{1,3})(?:_|-|\s|$)/);
  if (priceMatch) {
    const parsed = parseInt(priceMatch[1], 10);
    if (parsed >= 1 && parsed <= 499) {
      price = parsed;
      // Remove price token from clean title
      baseName = baseName.replace(priceMatch[0], ' ');
    }
  }

  // If no explicit price found, assign from rotating price tiers (149 to 499)
  if (!price) {
    price = PRICE_TIERS[index % PRICE_TIERS.length];
  }

  // Clean title: replace underscores, hyphens with spaces and capitalize words
  let cleanTitle = baseName
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/\s+/g, ' ');

  if (!cleanTitle) {
    cleanTitle = `Exclusive Asset ${index + 1}`;
  }

  // Title Case
  cleanTitle = cleanTitle.replace(/\b\w/g, c => c.toUpperCase());

  const isVideo = VALID_VIDEO_EXTS.includes(ext.toLowerCase());
  const mimeType = isVideo
    ? (ext.toLowerCase() === '.mov' ? 'video/quicktime' : 'video/mp4')
    : (ext.toLowerCase() === '.png' ? 'image/png' : ext.toLowerCase() === '.webp' ? 'image/webp' : 'image/jpeg');

  return {
    title: cleanTitle,
    price,
    mediaType: isVideo ? 'video' : 'photo',
    mimeType,
    ext: ext.toLowerCase()
  };
}

/**
 * Syncs all files present in add_images_here folder into database
 */
async function syncImagesFolder() {
  ensureSourceDir();

  const files = fs.readdirSync(IMAGES_SOURCE_DIR);
  const eligibleFiles = files.filter(f => {
    if (f.startsWith('.')) return false;
    if (f.toLowerCase().endsWith('.txt') || f.toLowerCase().endsWith('.md')) return false;
    const ext = path.extname(f).toLowerCase();
    return VALID_EXTS.includes(ext);
  });

  console.log(`[Image Sync] Checking ${eligibleFiles.length} file(s) in "add_images_here"...`);

  let addedCount = 0;
  let skippedCount = 0;
  const addedItems = [];

  for (let i = 0; i < eligibleFiles.length; i++) {
    const fileName = eligibleFiles[i];
    const sourceFilePath = path.join(IMAGES_SOURCE_DIR, fileName);

    try {
      const stats = fs.statSync(sourceFilePath);
      if (stats.size === 0) continue; // Skip empty files

      // Check if already synced in DB by originalFileName
      const existing = await Media.findOne({ originalFileName: fileName });
      if (existing) {
        skippedCount++;
        continue;
      }

      const { title, price, mediaType, mimeType, ext } = parseFileInfo(fileName, i);

      // Create unique file keys for originals & previews
      const randomSuffix = crypto.randomBytes(4).toString('hex');
      const baseSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      const uniqueOriginalKey = `orig_${Date.now()}_${randomSuffix}${ext}`;
      const uniquePreviewKey = `prev_${Date.now()}_${randomSuffix}${ext}`;

      const destOriginalPath = path.join(ORIGINALS_DIR, uniqueOriginalKey);
      const destPreviewPath = path.join(PREVIEWS_DIR, uniquePreviewKey);

      // Copy to protected originals directory
      fs.copyFileSync(sourceFilePath, destOriginalPath);

      // Copy to public previews directory (frontend will apply blur & watermarking overlay)
      fs.copyFileSync(sourceFilePath, destPreviewPath);

      // Ensure unique slug
      let slug = baseSlug || `media-${Date.now()}`;
      const slugExists = await Media.findOne({ slug });
      if (slugExists) {
        slug = `${slug}-${randomSuffix}`;
      }

      // Create database record
      const newMedia = await Media.create({
        title,
        slug,
        description: `High-resolution ${mediaType === 'video' ? '4K cinema video master' : '8K ultra-master photograph'}. Instant pay-to-unlock access with Razorpay.`,
        mediaType,
        category: mediaType === 'video' ? 'Cinematic' : 'Photography',
        tags: [mediaType, 'master', 'high-resolution', ...title.toLowerCase().split(' ')].filter(Boolean),
        price,
        currency: 'INR',
        previewUrl: `/uploads/previews/${uniquePreviewKey}`,
        originalFileKey: uniqueOriginalKey,
        originalFileName: fileName,
        mimeType,
        fileSize: stats.size,
        allowDownload: true,
        isPublished: true,
        viewsCount: 0,
        unlockCount: 0
      });

      addedCount++;
      addedItems.push(newMedia);
      console.log(`[Image Sync] ✅ Added "${title}" to website! Price: ₹${price} (File: ${fileName})`);
    } catch (err) {
      console.error(`[Image Sync Error] Failed to process ${fileName}:`, err.message);
    }
  }

  return {
    totalEligible: eligibleFiles.length,
    added: addedCount,
    skipped: skippedCount,
    items: addedItems
  };
}

let watcherInstance = null;
let debounceTimeout = null;

/**
 * Initializes automatic background file watching on "add_images_here" folder
 */
function startFolderWatcher() {
  ensureSourceDir();

  if (watcherInstance) return;

  try {
    watcherInstance = fs.watch(IMAGES_SOURCE_DIR, (eventType, filename) => {
      if (!filename || filename.startsWith('.') || filename.endsWith('.tmp')) return;

      const ext = path.extname(filename).toLowerCase();
      if (!VALID_EXTS.includes(ext)) return;

      // Debounce so rapid file writes don't trigger multiple syncs
      clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        console.log(`[Image Watcher] 📂 New image detected in "add_images_here": ${filename}. Syncing...`);
        try {
          const res = await syncImagesFolder();
          if (res.added > 0) {
            console.log(`[Image Watcher] ✨ Successfully synced ${res.added} new media item(s) to website!`);
          }
        } catch (e) {
          console.error('[Image Watcher Sync Error]', e.message);
        }
      }, 1500);
    });

    console.log(`[Image Watcher] 👁️ Watching "add_images_here" folder for new photos & videos.`);
  } catch (err) {
    console.warn(`[Image Watcher Warning] Could not start folder watcher: ${err.message}`);
  }
}

module.exports = {
  IMAGES_SOURCE_DIR,
  PRICE_TIERS,
  syncImagesFolder,
  startFolderWatcher
};
