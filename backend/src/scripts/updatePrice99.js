require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');

const uri = process.env.MONGODB_URI || 'mongodb://rahul:Rahul12345@ac-8s2sso2-shard-00-00.juxbxq8.mongodb.net:27017,ac-8s2sso2-shard-00-01.juxbxq8.mongodb.net:27017,ac-8s2sso2-shard-00-02.juxbxq8.mongodb.net:27017/unlockmedia?ssl=true&replicaSet=atlas-agy1iu-shard-0&authSource=admin&appName=Cluster0';

async function updatePrice() {
  await mongoose.connect(uri);
  console.log('[DB] Connected to MongoDB Atlas');

  // 1. Update in MongoDB Atlas
  const result = await mongoose.connection.collection('media').updateMany(
    { price: 1 },
    { $set: { price: 99 } }
  );
  console.log(`[Atlas Update] Changed ${result.modifiedCount} item(s) from ₹1 to ₹99.`);

  // 2. Fetch fresh catalog from Atlas
  const allMedia = await mongoose.connection.collection('media').find({}).toArray();

  // 3. Write updated catalog to frontend/public/data/media.json and frontend/dist/data/media.json
  const targets = [
    path.resolve(__dirname, '../../../frontend/public/data/media.json'),
    path.resolve(__dirname, '../../../frontend/dist/data/media.json')
  ];

  targets.forEach(target => {
    const dir = path.dirname(target);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(target, JSON.stringify(allMedia, null, 2), 'utf8');
    console.log(`[File Saved] Updated: ${target}`);
  });

  process.exit(0);
}

updatePrice().catch(err => {
  console.error('[Update Error]', err);
  process.exit(1);
});
