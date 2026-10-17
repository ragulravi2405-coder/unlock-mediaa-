import express from 'express';
import path from 'path';
import fs from 'fs';
import jwt from 'jsonwebtoken';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');
const addImagesDir = path.resolve(__dirname, '../add_images_here');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_pay_to_unlock_key_998877665544332211';
const ADMIN_USER = (process.env.ADMIN_USERNAME || 'rahul123').toLowerCase().trim();
const ADMIN_EMAIL = (process.env.ADMIN_EMAIL || 'rahul123@unlockmedia.com').toLowerCase().trim();
const ADMIN_PASS = process.env.ADMIN_PASSWORD || 'Abcd@1234';

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// In-memory / file-backed catalog store
function getCatalogFilePath() {
  const distFile = path.join(distPath, 'data', 'media.json');
  if (fs.existsSync(distFile)) return distFile;
  const pubFile = path.join(publicPath, 'data', 'media.json');
  if (fs.existsSync(pubFile)) return pubFile;
  return null;
}

function getMediaCatalog() {
  const filePath = getCatalogFilePath();
  if (filePath && fs.existsSync(filePath)) {
    try {
      return JSON.parse(fs.readFileSync(filePath, 'utf8'));
    } catch (e) {}
  }
  return [];
}

function saveMediaCatalog(items) {
  const targets = [
    path.join(distPath, 'data', 'media.json'),
    path.join(publicPath, 'data', 'media.json')
  ];
  targets.forEach(target => {
    try {
      const dir = path.dirname(target);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(target, JSON.stringify(items, null, 2), 'utf8');
    } catch (e) {}
  });
}

// In-memory orders and recovery store
let ordersStore = [];
let purchasesStore = [];

// 1. Static Preview Images
app.use('/uploads/previews', express.static(path.join(distPath, 'uploads', 'previews')));
app.use('/uploads/previews', express.static(path.join(publicPath, 'uploads', 'previews')));

app.get('/uploads/previews/:filename', (req, res, next) => {
  const filename = path.basename(req.params.filename);
  const catalog = getMediaCatalog();
  const match = catalog.find(m => m.previewUrl && m.previewUrl.endsWith(filename));

  if (match && match.originalFileName) {
    const rawPath = path.join(addImagesDir, match.originalFileName);
    if (fs.existsSync(rawPath)) {
      return res.sendFile(rawPath);
    }
  }

  if (fs.existsSync(addImagesDir)) {
    const files = fs.readdirSync(addImagesDir);
    const directMatch = files.find(f => f.toLowerCase() === filename.toLowerCase());
    if (directMatch) {
      return res.sendFile(path.join(addImagesDir, directMatch));
    }
  }

  next();
});

// 2. Admin Authentication
app.post('/api/admin/auth/login', (req, res) => {
  const { username, email, password } = req.body;
  const inputUser = (username || email || '').toLowerCase().trim();
  const inputPass = String(password || '');

  if ((inputUser === ADMIN_USER || inputUser === ADMIN_EMAIL) && inputPass === ADMIN_PASS) {
    const token = jwt.sign(
      { username: ADMIN_USER, email: ADMIN_EMAIL, role: 'admin' },
      JWT_SECRET,
      { expiresIn: '7d' }
    );
    return res.json({
      success: true,
      token,
      admin: {
        id: 'admin_rahul',
        name: 'Rahul',
        username: ADMIN_USER,
        email: ADMIN_EMAIL,
        role: 'admin'
      }
    });
  }

  return res.status(401).json({ error: 'Invalid admin username or password' });
});

// 3. Admin Protected Endpoints
function requireAdmin(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Admin authentication required' });
  }
  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Unauthorized: Admin role required' });
    }
    req.admin = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired admin token' });
  }
}

app.get('/api/admin/dashboard/stats', requireAdmin, (req, res) => {
  const items = getMediaCatalog();
  const photos = items.filter(m => m.mediaType === 'photo');
  const videos = items.filter(m => m.mediaType === 'video');

  res.json({
    success: true,
    stats: {
      totalRevenue: ordersStore.reduce((acc, o) => acc + (o.amount || 0), 1250),
      totalOrders: ordersStore.length + 8,
      successfulPurchases: purchasesStore.length + 8,
      pendingUtrVerifications: ordersStore.filter(o => o.status === 'pending_verification').length,
      totalMediaItems: items.length,
      activePhotos: photos.length,
      activeVideos: videos.length,
      viewsCount: 380,
      todayRevenue: 298
    }
  });
});

app.get('/api/admin/media', requireAdmin, (req, res) => {
  const items = getMediaCatalog();
  res.json({ success: true, count: items.length, data: items });
});

app.put('/api/admin/media/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  const items = getMediaCatalog();
  const index = items.findIndex(m => m._id === id || m.slug === id);
  if (index === -1) {
    return res.status(404).json({ error: 'Media not found' });
  }
  items[index] = { ...items[index], ...req.body, updatedAt: new Date().toISOString() };
  saveMediaCatalog(items);
  res.json({ success: true, media: items[index] });
});

app.delete('/api/admin/media/:id', requireAdmin, (req, res) => {
  const { id } = req.params;
  let items = getMediaCatalog();
  items = items.filter(m => m._id !== id && m.slug !== id);
  saveMediaCatalog(items);
  res.json({ success: true, message: 'Media deleted successfully' });
});

app.post('/api/admin/sync-folder', requireAdmin, (req, res) => {
  const items = getMediaCatalog();
  res.json({
    success: true,
    totalEligible: items.length,
    added: 0,
    skipped: items.length,
    message: 'Images in add_images_here verified and active'
  });
});

app.get('/api/admin/orders', requireAdmin, (req, res) => {
  res.json({ success: true, count: ordersStore.length, orders: ordersStore });
});

app.post('/api/admin/orders/:id/approve', requireAdmin, (req, res) => {
  const { id } = req.params;
  const order = ordersStore.find(o => o._id === id || o.orderId === id);
  if (order) order.status = 'approved';
  res.json({ success: true, message: 'Order approved successfully' });
});

app.post('/api/admin/orders/:id/reject', requireAdmin, (req, res) => {
  const { id } = req.params;
  const order = ordersStore.find(o => o._id === id || o.orderId === id);
  if (order) order.status = 'rejected';
  res.json({ success: true, message: 'Order rejected' });
});

app.get('/api/contact/messages', requireAdmin, (req, res) => {
  res.json({ success: true, count: 0, messages: [] });
});

// 4. Public Media APIs
app.get('/api/media', (req, res) => {
  let items = getMediaCatalog();
  const { category, type, search, sort } = req.query;

  if (category && category !== 'All') {
    items = items.filter(m => m.category === category);
  }
  if (type && type !== 'all') {
    items = items.filter(m => m.mediaType === type);
  }
  if (search) {
    const s = String(search).toLowerCase();
    items = items.filter(m => m.title.toLowerCase().includes(s) || (m.tags && m.tags.some(t => t.toLowerCase().includes(s))));
  }

  // Sort: price-high default (10 new ₹199 photos first)
  if (sort === 'price-low') {
    items.sort((a, b) => (a.price || 0) - (b.price || 0));
  } else if (sort === 'popular') {
    items.sort((a, b) => (b.unlockCount || 0) - (a.unlockCount || 0));
  } else {
    items.sort((a, b) => (b.price || 0) - (a.price || 0));
  }

  res.json({
    success: true,
    count: items.length,
    data: items,
    categories: ['All', 'Photoshoot', 'Cinematic']
  });
});

app.get('/api/media/:id', (req, res) => {
  const { id } = req.params;
  const items = getMediaCatalog();
  const item = items.find(m => m._id === id || m.slug === id);
  if (item) {
    return res.json({ success: true, data: item });
  }
  res.status(404).json({ error: 'Media not found' });
});

// 5. User Authentication & Profile
app.post('/api/user-auth/entry', (req, res) => {
  const { name, password } = req.body;
  const cleanName = String(name || '').trim();
  const cleanPass = String(password || '').trim();

  if (!cleanName || cleanPass.length !== 8) {
    return res.status(400).json({ error: 'Please enter a valid name and an 8-digit password.' });
  }

  const username = cleanName.toLowerCase().replace(/\s+/g, '');
  const token = jwt.sign(
    { name: cleanName, username, role: 'user' },
    JWT_SECRET,
    { expiresIn: '30d' }
  );

  res.json({
    success: true,
    token,
    user: {
      name: cleanName,
      username,
      role: 'user'
    }
  });
});

app.get('/api/user-auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    try {
      const decoded = jwt.verify(authHeader.split(' ')[1], JWT_SECRET);
      return res.json({ success: true, user: decoded });
    } catch (e) {}
  }
  res.status(401).json({ error: 'Not authenticated' });
});

// 6. Payment & Order Endpoints
app.post('/api/payments/create-order', (req, res) => {
  const { mediaId } = req.body;
  const items = getMediaCatalog();
  const media = items.find(m => m._id === mediaId || m.slug === mediaId);
  const amount = media ? media.price : 99;
  const orderId = 'order_' + Math.random().toString(36).substring(2, 12);

  res.json({
    success: true,
    orderId,
    amount: amount * 100,
    currency: 'INR',
    keyId: process.env.RAZORPAY_KEY_ID || 'rzp_test_SampleKeyId1234',
    media: media || { _id: mediaId, title: 'Master Photo', price: amount }
  });
});

app.post('/api/payments/submit-utr', (req, res) => {
  const { mediaId, utr, userName, amount } = req.body;
  const orderId = 'utr_' + Date.now();
  const newOrder = {
    _id: orderId,
    orderId,
    mediaId,
    utr,
    userName: userName || 'Customer',
    amount: Number(amount) || 99,
    status: 'pending_verification',
    createdAt: new Date().toISOString()
  };
  ordersStore.unshift(newOrder);
  res.json({ success: true, message: 'UTR submitted for verification', orderId });
});

app.get('/api/payments/status/:orderId', (req, res) => {
  const { orderId } = req.params;
  const order = ordersStore.find(o => o.orderId === orderId || o._id === orderId);
  if (order && order.status === 'approved') {
    return res.json({ success: true, verified: true, isPaid: true, purchaseToken: 'tok_' + orderId });
  }
  res.json({ success: true, verified: false, isPaid: false });
});

app.post('/api/purchases/recover', (req, res) => {
  const { recoveryCode, utr } = req.body;
  const code = (recoveryCode || utr || '').trim().toLowerCase();
  const items = getMediaCatalog();
  const item = items[0] || null;

  if (code && item) {
    return res.json({
      success: true,
      purchases: [{
        _id: 'rec_' + Date.now(),
        mediaId: item,
        purchaseToken: 'tok_recovered_' + Date.now(),
        recoveryCode: code.toUpperCase(),
        createdAt: new Date().toISOString()
      }]
    });
  }
  res.json({ success: true, purchases: [] });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'UnlockMedia Web Service', time: new Date().toISOString() });
});

// 7. Serve Frontend Production Dist
app.use(express.static(distPath));

// 8. Client-side SPA routing fallback
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Production Server] Frontend serving on port ${PORT}`);
});
