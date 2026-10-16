const rateLimit = require('express-rate-limit');

// General API rate limiter: 120 requests per minute
const apiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 120,
  message: { error: 'Too many requests. Please try again in a minute.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Checkout order creation limiter: 15 per minute per IP to prevent spamming Razorpay
const checkoutLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 15,
  message: { error: 'Too many payment requests initiated. Please wait a moment before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Recovery and access token check limiter: 20 attempts per 15 minutes to prevent brute-forcing tokens/codes
const recoveryLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { error: 'Too many recovery attempts. Please wait 15 minutes before trying again.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Contact and support form limiter: 5 messages per 15 minutes
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: 'Too many support messages sent. Please wait before submitting another inquiry.' },
  standardHeaders: true,
  legacyHeaders: false
});

// Admin login limiter: 5 attempts per 15 minutes
const adminLoginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 8,
  message: { error: 'Too many failed login attempts. Please try again after 15 minutes.' },
  standardHeaders: true,
  legacyHeaders: false
});

module.exports = {
  apiLimiter,
  checkoutLimiter,
  recoveryLimiter,
  contactLimiter,
  adminLoginLimiter
};
