const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  mediaId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Media',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true // in paise (e.g. 9900 for ₹99)
  },
  currency: {
    type: String,
    default: 'INR'
  },
  status: {
    type: String,
    enum: ['created', 'attempted', 'paid', 'failed', 'refunded'],
    default: 'created',
    index: true
  },
  customerSessionId: {
    type: String,
    index: true
  },
  paymentId: {
    type: String,
    sparse: true,
    index: true
  },
  paymentSignature: {
    type: String
  },
  paymentMethod: {
    type: String
  },
  receipt: {
    type: String,
    required: true
  },
  failureReason: {
    type: String
  },
  verifiedAt: {
    type: Date
  },
  metadata: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Order', orderSchema);
