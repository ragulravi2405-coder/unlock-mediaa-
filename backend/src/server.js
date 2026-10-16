require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const path = require('path');
const connectDB = require('./config/db');

// Controllers / Handlers
const mediaController = require('./controllers/mediaController');
const { PREVIEWS_DIR } = require('./services/storageService');

// Seed check helper
const Media = require('./models/Media');
const { seedDatabase } = require('./seed/seedMedia');

const app = express();
const PORT = process.env.PORT || 5000;

// Connect to MongoDB
connectDB().then(async () => {
  // Check if media collection has items; if not, auto-seed
  try {
    const count = await Media.countDocuments();
    if (count === 0) {
      console.log('[Auto-Seed] Media collection is empty. Running initial catalog seed...');
      // Run seed without process.exit
      const { sampleMedia } = require('./seed/seedMedia');
      const Admin = require('./models/Admin');
      const bcrypt = require('bcryptjs');

      const adminEmail = (process.env.ADMIN_EMAIL || 'admin@unlockmedia.com').toLowerCase().trim();
      const existingAdmin = await Admin.findOne({ email: adminEmail });
      if (!existingAdmin) {
        const defaultPassword = process.env.ADMIN_PASSWORD || 'AdminSecurePass123!';
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(defaultPassword, salt);
        await Admin.create({
          email: adminEmail,
          password: hashedPassword,
          name: 'Lead Curator',
          role: 'admin'
        });
        console.log(`[Auto-Seed] Created admin account: ${adminEmail}`);
      }

      for (const item of sampleMedia) {
        await Media.create(item);
      }
      console.log(`[Auto-Seed] Seeded ${sampleMedia.length} initial items successfully!`);
    }
  } catch (seedErr) {
    console.warn('[Auto-Seed Warning]', seedErr.message);
  }
});

// Security headers with Helmet
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" },
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://checkout.razorpay.com", "https://api.razorpay.com"],
      frameSrc: ["'self'", "https://api.razorpay.com"],
      imgSrc: ["'self'", "data:", "blob:", "https://images.unsplash.com", "https://*.razorpay.com"],
      mediaSrc: ["'self'", "blob:", "data:"],
      connectSrc: ["'self'", "http://localhost:*", "https://api.razorpay.com", "https://lumberjack.razorpay.com"]
    }
  }
}));

// CORS Configuration
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:5173',
  'http://localhost:3000',
  'http://127.0.0.1:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, curl, postman) or matching origin
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(null, true); // Allow all in dev for ease of deployment
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Range', 'x-razorpay-signature']
}));

app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Capture raw body specifically for Razorpay Webhook signature verification
app.use(express.json({
  verify: (req, res, buf) => {
    if (req.originalUrl.includes('/api/payments/webhook')) {
      req.rawBody = buf;
    }
  },
  limit: '10mb'
}));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Serve public previews folder statically
app.use('/uploads/previews', express.static(PREVIEWS_DIR, {
  maxAge: '1d',
  immutable: true
}));

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'Pay-to-Unlock Media API',
    uptime: process.uptime()
  });
});

// Direct protected media stream endpoint
app.get('/api/protected-media/:id', mediaController.streamProtectedMedia);

// API Routes
app.use('/api/media', require('./routes/mediaRoutes'));
app.use('/api/payments', require('./routes/paymentRoutes'));
app.use('/api/purchases', require('./routes/purchaseRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/contact', require('./routes/contactRoutes'));

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'Requested API endpoint does not exist' });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('[Unhandled Server Error]', err);
  const status = err.status || 500;
  res.status(status).json({
    error: err.message || 'Internal server error occurred',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

app.listen(PORT, () => {
  console.log(`\n======================================================`);
  console.log(`🚀 Pay-to-Unlock Server running on port ${PORT}`);
  console.log(`📡 URL: http://localhost:${PORT}`);
  console.log(`⚡ Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`======================================================\n`);
});
