const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const fs = require('fs');
const { ORIGINALS_DIR, PREVIEWS_DIR } = require('../services/storageService');

// Allowed MIME types
const ALLOWED_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'video/mp4',
  'video/webm',
  'video/quicktime'
];

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // If fieldname is 'originalFile', store in protected originals directory
    // If fieldname is 'previewFile', store in previews directory
    if (file.fieldname === 'originalFile') {
      cb(null, ORIGINALS_DIR);
    } else {
      cb(null, PREVIEWS_DIR);
    }
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    const uniqueId = crypto.randomBytes(16).toString('hex');
    cb(null, `${uniqueId}${ext}`);
  }
});

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Unsupported file type: ${file.mimetype}. Allowed types: JPEG, PNG, WEBP, MP4, WEBM, MOV`), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 150 * 1024 * 1024 // 150MB maximum for media files
  }
});

module.exports = upload;
