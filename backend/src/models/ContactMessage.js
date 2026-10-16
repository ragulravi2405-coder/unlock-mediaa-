const mongoose = require('mongoose');

const contactMessageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: 100
  },
  email: {
    type: String,
    required: [true, 'Valid email is required'],
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    trim: true,
    maxlength: 150
  },
  category: {
    type: String,
    enum: ['support', 'recovery', 'refund', 'copyright', 'general'],
    default: 'general'
  },
  orderRef: {
    type: String,
    trim: true
  },
  message: {
    type: String,
    required: [true, 'Message content is required'],
    trim: true,
    maxlength: 3000
  },
  ipAddress: {
    type: String
  },
  status: {
    type: String,
    enum: ['unread', 'in_progress', 'resolved'],
    default: 'unread'
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('ContactMessage', contactMessageSchema);
