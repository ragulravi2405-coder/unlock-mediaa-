const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Title is required'],
    trim: true,
    maxlength: 120
  },
  slug: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
    index: true
  },
  description: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  mediaType: {
    type: String,
    enum: ['photo', 'video'],
    required: true,
    index: true
  },
  category: {
    type: String,
    default: 'General',
    index: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  price: {
    type: Number,
    required: true,
    default: 99, // default ₹99 INR
    min: [1, 'Price must be at least ₹1'],
    max: [499, 'Price must not exceed ₹499']
  },
  currency: {
    type: String,
    default: 'INR'
  },
  previewUrl: {
    type: String,
    required: [true, 'Public preview thumbnail or teaser clip is required']
  },
  // Protected fields: NEVER returned in public API lists
  originalFileKey: {
    type: String,
    required: [true, 'Protected original file reference is required'],
    select: false // Excluded by default from queries
  },
  originalFileName: {
    type: String,
    select: false
  },
  mimeType: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number, // in bytes
    default: 0
  },
  dimensions: {
    width: { type: Number, default: 0 },
    height: { type: Number, default: 0 }
  },
  duration: {
    type: Number, // in seconds (for videos)
    default: 0
  },
  allowDownload: {
    type: Boolean,
    default: true
  },
  isPublished: {
    type: Boolean,
    default: true,
    index: true
  },
  viewsCount: {
    type: Number,
    default: 0
  },
  unlockCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes for fast searching and filtering
mediaSchema.index({ title: 'text', description: 'text', tags: 'text' });
mediaSchema.index({ mediaType: 1, isPublished: 1, createdAt: -1 });

module.exports = mongoose.model('Media', mediaSchema);
