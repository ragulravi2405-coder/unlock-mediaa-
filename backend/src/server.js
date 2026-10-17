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
  try {
    const Admin = require('./models/Admin');
    const bcrypt = require('bcryptjs');

    const adminUsername = (process.env.ADMIN_USERNAME || 'rahul123').toLowerCase().trim();
    const adminEmail = (process.env.ADMIN_EMAIL || 'rahul123@unlockmedia.com').toLowerCase().trim();
    const defaultPassword = process.env.ADMIN_PASSWORD || 'Abcd@1234';

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(defaultPassword, salt);

    const existingAdmin = await Admin.findOne({
      $or: [{ username: adminUsername }, { email: adminEmail }]
    });

    if (!existingAdmin) {
      await Admin.create({
        username: adminUsername,
        email: adminEmail,
        password: hashedPassword,
        name: 'Rahul',
        role: 'admin'
      });
      console.log(`[Admin] Initialized admin account: username="${adminUsername}"`);
    } else {
      existingAdmin.username = adminUsername;
      existingAdmin.password = hashedPassword;
      existingAdmin.name = 'Rahul';
      await existingAdmin.save();
      console.log(`[Admin] Updated admin account: username="${adminUsername}"`);
    }

    // Auto-sync images from "add_images_here" folder and launch real-time watcher
    const { syncImagesFolder, startFolderWatcher } = require('./services/imageSyncService');
    await syncImagesFolder();
    startFolderWatcher();
  } catch (err) {
    console.warn('[Startup Init Warning]', err.message);
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
app.use('/api/user-auth', require('./routes/userAuthRoutes'));
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
