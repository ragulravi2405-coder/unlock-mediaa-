const mongoose = require('mongoose');

const purchaseSchema = new mongoose.Schema({
  purchaseTokenHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  recoveryCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    index: true
  },
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: true,
    index: true
  },
  orderId: {
    type: String,
    required: true,
    index: true
  },
  paymentId: {
    type: String,
    required: true
  },
  amountPaid: {
    type: Number,
    required: true
  },
  currency: {
    type: String,
    default: 'INR'
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date,
    default: Date.now
  },
  expiresAt: {
    type: Date,
    default: null // null signifies unlimited personal access
  },
  status: {
    type: String,
    enum: ['active', 'revoked', 'refunded'],
    default: 'active',
    index: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Purchase', purchaseSchema);
