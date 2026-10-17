import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5173;
const distPath = path.join(__dirname, 'dist');
const publicPath = path.join(__dirname, 'public');
const addImagesDir = path.resolve(__dirname, '../add_images_here');

app.use(express.json());

// Helper to load catalog data
function getMediaCatalog() {
  const distFile = path.join(distPath, 'data', 'media.json');
  const pubFile = path.join(publicPath, 'data', 'media.json');
  if (fs.existsSync(distFile)) {
    try { return JSON.parse(fs.readFileSync(distFile, 'utf8')); } catch (e) {}
  }
  if (fs.existsSync(pubFile)) {
    try { return JSON.parse(fs.readFileSync(pubFile, 'utf8')); } catch (e) {}
  }
  return [];
}

// 1. Serve static previews from dist, public, or fallback to add_images_here
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

  // Check directly in add_images_here if file exists by exact or approximate name
  if (fs.existsSync(addImagesDir)) {
    const files = fs.readdirSync(addImagesDir);
    const directMatch = files.find(f => f.toLowerCase() === filename.toLowerCase());
    if (directMatch) {
      return res.sendFile(path.join(addImagesDir, directMatch));
    }
  }

  next();
});

// 2. Built-in API endpoints for media
app.get('/api/media', (req, res) => {
  let items = getMediaCatalog();
  const { category, type, search } = req.query;

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'UnlockMedia Web Service', time: new Date().toISOString() });
});

// 3. Serve static assets from Vite production build
app.use(express.static(distPath));

// 4. Client-side SPA routing fallback (compatible with Express 4 and Express 5)
app.use((req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`[Production Server] Frontend serving on port ${PORT}`);
});
