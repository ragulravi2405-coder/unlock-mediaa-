require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb://rahul:Rahul12345@ac-8s2sso2-shard-00-00.juxbxq8.mongodb.net:27017,ac-8s2sso2-shard-00-01.juxbxq8.mongodb.net:27017,ac-8s2sso2-shard-00-02.juxbxq8.mongodb.net:27017/unlockmedia?ssl=true&replicaSet=atlas-agy1iu-shard-0&authSource=admin&appName=Cluster0';

const IMAGES_DIR = path.resolve(__dirname, '../../../add_images_here');
const BACKEND_PREVIEWS = path.resolve(__dirname, '../../uploads/previews');
const BACKEND_ORIGINALS = path.resolve(__dirname, '../../uploads/originals');
const FRONTEND_PUB_PREVIEWS = path.resolve(__dirname, '../../../frontend/public/uploads/previews');
const FRONTEND_DIST_PREVIEWS = path.resolve(__dirname, '../../../frontend/dist/uploads/previews');

[BACKEND_PREVIEWS, BACKEND_ORIGINALS, FRONTEND_PUB_PREVIEWS, FRONTEND_DIST_PREVIEWS].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
});

const titlesMap = {
  'WhatsApp Image 2026-10-17 at 9.51.13 PM.jpeg': {
    title: 'Raw Masculine Workshop Master',
    desc: '🔥 [தமிழ்]: வொர்க்ஷாப் பின்னணியில் எடுக்கப்பட்ட கம்பீரமான மற்றும் கவர்ச்சிகரமான மாஸ்டர் போட்டோ!\n\n⚡ [English]: Raw, bold workshop photoshoot with powerful masculine physique. Full master resolution unlocked upon payment.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.13 PM (1).jpeg': {
    title: 'Bold Athletic Studio Showcase 1',
    desc: '⚡ [தமிழ்]: கவர்ச்சியான தடகள உடல்வாகுடன் கூடிய பிரத்யேக போட்டோஷூட்!\n\n⚡ [English]: Athletic, ripped physique highlighted in pristine natural studio light. Instant unblur upon unlock.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.13 PM (2).jpeg': {
    title: 'Sensual Physique Master Portrait 1',
    desc: '🔥 [தமிழ்]: நளினமான மற்றும் கவர்ச்சிகரமான ஹாட் போஸ்!\n\n⚡ [English]: Sultry artistic photoshoot capturing dynamic muscle definition in uncompressed ultra-HD.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.13 PM (3).jpeg': {
    title: 'Sensual Physique Master Portrait 2',
    desc: '🌊 [தமிழ்]: கவர்ச்சியான மற்றும் அன்சென்சார் செய்யப்பட்ட ஹாட் மாஸ்டர் போஸ்!\n\n⚡ [English]: Deep, evocative portraiture with seductive lighting and razor-sharp clarity.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.14 PM.jpeg': {
    title: 'Exclusive Bold Muscular Reel 1',
    desc: '🔥 [தமிழ்]: மிக நெருக்கமான ஹாட் போஸ் - முழு தெளிவான அன்சென்சார் மாஸ்டர் படம்.\n\n⚡ [English]: Ultra-bold, masculine and intimate portrait in 8K uncompressed format.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.14 PM (1).jpeg': {
    title: 'Exclusive Bold Muscular Reel 2',
    desc: '⚡ [தமிழ்]: தனித்துவமான கவர்ச்சி போஸ் - உடற்பயிற்சி செய்த கம்பீரமான தோற்றம்.\n\n⚡ [English]: Sculpted athletic physique captured in raw clarity. Pay to unblur instantly.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.15 PM.jpeg': {
    title: 'Intimate Sensual Master Series 1',
    desc: '🔥 [தமிழ்]: கவர்ச்சிகரமான அன்சென்சார் ஹாட் போட்டோஷூட் மாஸ்டர்.\n\n⚡ [English]: Intimate and provocative master portrait with authentic aesthetic post-processing.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.15 PM (1).jpeg': {
    title: 'Intimate Sensual Master Series 2',
    desc: '📸 [தமிழ்]: வசீகரிக்கும் பார்வையில் எடுக்கப்பட்ட தனித்துவமான ஹாட் போட்டோ.\n\n⚡ [English]: Captivating close-up master with seductive angles and deep contrast.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.15 PM (2).jpeg': {
    title: 'Intimate Sensual Master Series 3',
    desc: '🔥 [தமிழ்]: உன்னதமான ஹாட் உடற்கட்டு போஸ் - அன்சென்சார் முழு புகைப்படம்.\n\n⚡ [English]: Sensational full-frame portraiture. Instant cryptographic delivery.'
  },
  'WhatsApp Image 2026-10-17 at 9.51.22 PM.jpeg': {
    title: 'Ultra HD Sensual Master Special',
    desc: '⭐ [தமிழ்]: உச்சகட்ட ஹாட் அண்ட் செக்ஸி பிரத்யேக மாஸ்டர் போட்டோ!\n\n⚡ [English]: Prime exclusive master capture with extraordinary sharpness and richness. Unlocked at ₹199.'
  }
};

async function run() {
  await mongoose.connect(uri);
  console.log('[DB] Connected to MongoDB Atlas');

  const cursor = mongoose.connection.collection('media').find({
    originalFileName: { $regex: 'WhatsApp', $options: 'i' }
  });

  const docs = await cursor.toArray();
  console.log(`[Found] ${docs.length} WhatsApp media documents in Atlas.`);

  for (const doc of docs) {
    const fileName = doc.originalFileName;
    const meta = titlesMap[fileName] || {
      title: 'Exclusive Sensual Master',
      desc: 'High-resolution unblurred master photograph.'
    };

    const sourcePath = path.join(IMAGES_DIR, fileName);
    if (fs.existsSync(sourcePath)) {
      const prevFile = path.basename(doc.previewUrl);
      const origKey = doc.originalFileKey;

      if (prevFile) {
        fs.copyFileSync(sourcePath, path.join(BACKEND_PREVIEWS, prevFile));
        fs.copyFileSync(sourcePath, path.join(FRONTEND_PUB_PREVIEWS, prevFile));
        fs.copyFileSync(sourcePath, path.join(FRONTEND_DIST_PREVIEWS, prevFile));
      }
      if (origKey) {
        fs.copyFileSync(sourcePath, path.join(BACKEND_ORIGINALS, origKey));
      }
    }

    await mongoose.connection.collection('media').updateOne(
      { _id: doc._id },
      {
        $set: {
          title: meta.title,
          description: meta.desc,
          price: 199,
          category: 'Photoshoot',
          tags: ['photoshoot', 'hot', 'exclusive', 'master', 'sensual', 'bold', '199'],
          updatedAt: new Date()
        }
      }
    );
    console.log(`[Updated] ✅ "${meta.title}" -> Price: ₹199 (File: ${fileName})`);
  }

  // Export full updated catalog to JSON
  const allMedia = await mongoose.connection.collection('media').find({}).toArray();
  console.log(`\n[Atlas Total] Total items in database now: ${allMedia.length}`);

  const targets = [
    path.resolve(__dirname, '../../../frontend/public/data/media.json'),
    path.resolve(__dirname, '../../../frontend/dist/data/media.json')
  ];

  targets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, JSON.stringify(allMedia, null, 2), 'utf8');
    console.log(`[Catalog Saved] ${target}`);
  });

  process.exit(0);
}

run().catch(err => {
  console.error('[Error]', err);
  process.exit(1);
});
