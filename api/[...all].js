const express = require('express');
const cors = require('cors');
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://rahul:Rahul12345@ac-8s2sso2-shard-00-00.juxbxq8.mongodb.net:27017,ac-8s2sso2-shard-00-01.juxbxq8.mongodb.net:27017,ac-8s2sso2-shard-00-02.juxbxq8.mongodb.net:27017/unlockmedia?ssl=true&replicaSet=atlas-agy1iu-shard-0&authSource=admin&appName=Cluster0";
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_pay_to_unlock_key_998877665544332211';
const TOKEN_SALT = process.env.TOKEN_SALT || 'salt_crypto_random_tokens_for_purchases_998877';

// Cached MongoDB connection for serverless execution
let isConnected = false;
async function connectToDatabase() {
  if (isConnected && mongoose.connection.readyState === 1) return;
  try {
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 8000 });
    isConnected = true;
  } catch (err) {
    console.error('[MongoDB Atlas Connection Error]', err.message);
    throw err;
  }
}

// Schemas & Models
const mediaSchema = new mongoose.Schema({
  title: String,
  slug: { type: String, unique: true },
  description: String,
  mediaType: { type: String, default: 'photo' },
  category: { type: String, default: 'Photoshoot' },
  tags: [String],
  price: Number,
  currency: { type: String, default: 'INR' },
  previewUrl: String,
  originalFileKey: String,
  originalFileName: String,
  mimeType: String,
  fileSize: Number,
  allowDownload: { type: Boolean, default: true },
  isPublished: { type: Boolean, default: true },
  viewsCount: { type: Number, default: 0 },
  unlockCount: { type: Number, default: 0 }
}, { timestamps: true });

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  role: { type: String, default: 'user' },
  lastLogin: Date
}, { timestamps: true });

const adminSchema = new mongoose.Schema({
  username: { type: String, unique: true, lowercase: true, trim: true },
  email: { type: String, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  name: { type: String, default: 'Administrator' },
  role: { type: String, default: 'admin' },
  lastLogin: Date
}, { timestamps: true });

const orderSchema = new mongoose.Schema({
  orderId: { type: String, required: true, unique: true },
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  mediaTitle: String,
  amount: Number,
  currency: { type: String, default: 'INR' },
  customerName: String,
  customerEmail: String,
  customerPhone: String,
  status: { type: String, default: 'created' },
  paymentType: { type: String, default: 'utr_manual' },
  utrNumber: String,
  rejectionReason: String,
  verifiedAt: Date,
  accessToken: String
}, { timestamps: true });

const purchaseSchema = new mongoose.Schema({
  orderId: String,
  mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
  amount: Number,
  currency: { type: String, default: 'INR' },
  customerEmail: String,
  customerPhone: String,
  customerIdentifier: String,
  customerName: String,
  paymentMethod: String,
  status: { type: String, default: 'completed' }
}, { timestamps: true });

const Media = mongoose.models.Media || mongoose.model('Media', mediaSchema);
const User = mongoose.models.User || mongoose.model('User', userSchema);
const Admin = mongoose.models.Admin || mongoose.model('Admin', adminSchema);
const Order = mongoose.models.Order || mongoose.model('Order', orderSchema);
const Purchase = mongoose.models.Purchase || mongoose.model('Purchase', purchaseSchema);

// Helper: Ensure DB connection on every request
app.use(async (req, res, next) => {
  try {
    await connectToDatabase();
    next();
  } catch (err) {
    res.status(500).json({ error: 'Database connection error', details: err.message });
  }
});

// -------------------------------------------------------------
// PUBLIC MEDIA ROUTES
// -------------------------------------------------------------
app.get('/api/media', async (req, res) => {
  try {
    const { category, type, search, sort = 'newest', limit = 24, page = 1 } = req.query;
    const filter = { isPublished: true };

    if (category && category !== 'All') filter.category = category;
    if (type && type !== 'all') filter.mediaType = type;
    if (search) {
      filter.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    let sortOption = { createdAt: -1 };
    if (sort === 'oldest') sortOption = { createdAt: 1 };
    if (sort === 'price_asc') sortOption = { price: 1 };
    if (sort === 'price_desc') sortOption = { price: -1 };
    if (sort === 'popular') sortOption = { unlockCount: -1 };

    const parsedLimit = Math.min(parseInt(limit, 10) || 24, 60);
    const parsedPage = Math.max(parseInt(page, 10) || 1, 1);
    const skip = (parsedPage - 1) * parsedLimit;

    const [items, total] = await Promise.all([
      Media.find(filter).sort(sortOption).skip(skip).limit(parsedLimit).lean(),
      Media.countDocuments(filter)
    ]);

    res.json({
      success: true,
      data: items,
      meta: {
        total,
        page: parsedPage,
        limit: parsedLimit,
        pages: Math.ceil(total / parsedLimit)
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/media/:slug', async (req, res) => {
  try {
    const item = await Media.findOne({ slug: req.params.slug, isPublished: true });
    if (!item) return res.status(404).json({ error: 'Media not found' });
    item.viewsCount = (item.viewsCount || 0) + 1;
    await item.save();
    res.json({ success: true, data: item });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// USER AUTH ROUTES (Name + 8-digit Password)
// -------------------------------------------------------------
app.post('/api/user-auth/entry', async (req, res) => {
  try {
    const { name, password } = req.body;
    if (!name || !name.trim()) {
      return res.status(400).json({ error: 'தயவுசெய்து உங்கள் பெயரை உள்ளிடவும் (Please enter your name).' });
    }
    if (!password || password.length < 8) {
      return res.status(400).json({ error: 'கடவுச்சொல் குறைந்தது 8 எழுத்துக்கள் கொண்டிருக்க வேண்டும் (Password must be at least 8 characters).' });
    }

    const cleanName = name.trim();
    const cleanUsername = cleanName.toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '');

    let user = await User.findOne({
      $or: [{ username: cleanUsername }, { name: { $regex: new RegExp(`^${cleanName}$`, 'i') } }]
    });

    if (!user) {
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(password, salt);
      user = await User.create({
        name: cleanName,
        username: cleanUsername,
        password: hashedPassword,
        lastLogin: new Date()
      });

      const token = jwt.sign({ id: user._id, name: user.name, username: user.username }, JWT_SECRET, { expiresIn: '60d' });
      return res.json({
        success: true,
        isNewUser: true,
        message: `வரவேற்கிறோம் ${user.name}! உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது.`,
        token,
        user: { id: user._id, name: user.name, username: user.username }
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'தவறான கடவுச்சொல்! சரியான 8 இலக்க கடவுச்சொல்லை உள்ளிடவும் (Incorrect password).' });
    }

    user.lastLogin = new Date();
    await user.save();

    const token = jwt.sign({ id: user._id, name: user.name, username: user.username }, JWT_SECRET, { expiresIn: '60d' });
    return res.json({
      success: true,
      isNewUser: false,
      message: `மீண்டும் வருக, ${user.name}! (Welcome back)`,
      token,
      user: { id: user._id, name: user.name, username: user.username }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/user-auth/me', async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'No token' });
    const token = authHeader.replace('Bearer ', '');
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ success: true, user });
  } catch (err) {
    res.status(401).json({ error: 'Invalid session' });
  }
});

// -------------------------------------------------------------
// ADMIN AUTH & DASHBOARD ROUTES (rahul123 / Abcd@1234)
// -------------------------------------------------------------
app.post('/api/admin/auth/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password required' });
    }

    const cleanInput = username.trim().toLowerCase();
    const admin = await Admin.findOne({
      $or: [{ username: cleanInput }, { email: cleanInput }]
    });

    if (!admin) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    const isMatch = await bcrypt.compare(password, admin.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid admin credentials' });
    }

    admin.lastLogin = new Date();
    await admin.save();

    const token = jwt.sign({ id: admin._id, username: admin.username, role: 'admin' }, JWT_SECRET, { expiresIn: '7d' });
    res.json({
      success: true,
      token,
      admin: { id: admin._id, username: admin.username, name: admin.name, email: admin.email, role: 'admin' }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/dashboard/stats', async (req, res) => {
  try {
    const [totalMedia, totalOrders, verifiedOrders, pendingOrders, usersCount] = await Promise.all([
      Media.countDocuments(),
      Order.countDocuments(),
      Order.countDocuments({ status: 'verified' }),
      Order.countDocuments({ status: 'pending_verification' }),
      User.countDocuments()
    ]);

    const revenueResult = await Order.aggregate([
      { $match: { status: 'verified' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    const totalRevenue = revenueResult[0]?.total || 0;

    res.json({
      success: true,
      stats: {
        totalMedia,
        totalOrders,
        verifiedOrders,
        pendingOrders,
        totalRevenue,
        usersCount
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 }).limit(100);
    res.json({ success: true, orders });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/media', async (req, res) => {
  try {
    const media = await Media.find().sort({ createdAt: -1 });
    res.json({ success: true, media });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Approve Order
app.post('/api/admin/orders/:id/approve', async (req, res) => {
  try {
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'verified';
    order.verifiedAt = new Date();

    // Create Access Token
    const payload = `${order.mediaId}:${order._id}:${Math.floor(Date.now() / 1000)}`;
    const signature = crypto.createHmac('sha256', TOKEN_SALT).update(payload).digest('hex');
    const accessToken = Buffer.from(JSON.stringify({ payload, signature })).toString('base64');
    order.accessToken = accessToken;
    await order.save();

    // Create Purchase
    await Purchase.create({
      orderId: order.orderId,
      mediaId: order.mediaId,
      amount: order.amount,
      customerEmail: order.customerEmail || 'customer@direct.in',
      customerPhone: order.customerPhone || '9876543210',
      customerIdentifier: order.customerPhone || order.customerEmail || order.customerName,
      customerName: order.customerName || 'Customer',
      paymentMethod: 'razorpay_upi',
      status: 'completed'
    });

    await Media.findByIdAndUpdate(order.mediaId, { $inc: { unlockCount: 1 } });
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Reject Order
app.post('/api/admin/orders/:id/reject', async (req, res) => {
  try {
    const { reason = 'Payment verification failed' } = req.body;
    const order = await Order.findById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });

    order.status = 'failed';
    order.rejectionReason = reason;
    await order.save();
    res.json({ success: true, order });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// -------------------------------------------------------------
// PAYMENTS & UTR SUBMISSIONS
// -------------------------------------------------------------
app.post('/api/payments/submit-utr', async (req, res) => {
  try {
    const { mediaId, amount, customerName, customerEmail, customerPhone, utrNumber } = req.body;
    if (!mediaId || !amount || !utrNumber) {
      return res.status(400).json({ error: 'Missing required payment details' });
    }

    const cleanUtr = String(utrNumber).trim();
    if (cleanUtr.length < 10) {
      return res.status(400).json({ error: 'Valid 12-digit UTR or Reference number is required' });
    }

    const media = await Media.findById(mediaId);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const orderId = `order_utr_${Date.now()}_${crypto.randomBytes(2).toString('hex')}`;
    const newOrder = await Order.create({
      orderId,
      mediaId: media._id,
      mediaTitle: media.title,
      amount: Number(amount),
      customerName: customerName || 'Valued Customer',
      customerEmail: customerEmail || 'customer@direct.in',
      customerPhone: customerPhone || '9876543210',
      status: 'pending_verification',
      paymentType: 'razorpay_me_utr',
      utrNumber: cleanUtr
    });

    res.status(201).json({
      success: true,
      status: 'pending_verification',
      orderId: newOrder.orderId,
      message: 'UTR submitted for verification. Media unlocks as soon as payment is confirmed.'
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/payments/order/:orderId', async (req, res) => {
  try {
    const order = await Order.findOne({ orderId: req.params.orderId });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    res.json({
      success: true,
      order: {
        orderId: order.orderId,
        status: order.status,
        amount: order.amount,
        mediaId: order.mediaId,
        accessToken: order.accessToken,
        verifiedAt: order.verifiedAt,
        rejectionReason: order.rejectionReason
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Purchases / Library
app.post('/api/purchases/my-library', async (req, res) => {
  try {
    const { identifier, phone, email } = req.body;
    const lookup = identifier || phone || email;
    if (!lookup) return res.json({ success: true, purchases: [] });

    const purchases = await Purchase.find({
      $or: [
        { customerEmail: { $regex: new RegExp(`^${lookup}$`, 'i') } },
        { customerPhone: lookup },
        { customerIdentifier: lookup }
      ]
    }).populate('mediaId').sort({ createdAt: -1 });

    res.json({ success: true, purchases });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Access Token generation
app.post('/api/media/:id/access', async (req, res) => {
  try {
    const media = await Media.findById(req.params.id);
    if (!media) return res.status(404).json({ error: 'Media not found' });

    const payload = `${media._id}:${Date.now()}`;
    const signature = crypto.createHmac('sha256', TOKEN_SALT).update(payload).digest('hex');
    const token = Buffer.from(JSON.stringify({ payload, signature })).toString('base64');

    res.json({
      success: true,
      accessToken: token,
      downloadUrl: `/uploads/originals/${media.originalFileKey}?download=true`,
      streamUrl: `/uploads/originals/${media.originalFileKey}`
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Fallback 404 for API
app.use('/api/*', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

module.exports = app;
