require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const { syncImagesFolder } = require('../services/imageSyncService');

async function run() {
  try {
    await connectDB();
    console.log('\n======================================================');
    console.log('🔄 Running Image Sync for "add_images_here" folder...');
    console.log('======================================================');
    
    const result = await syncImagesFolder();
    
    console.log('\n======================================================');
    console.log(`✅ Sync Complete!`);
    console.log(`📁 Total Files Evaluated: ${result.totalEligible}`);
    console.log(`✨ Newly Added to Website: ${result.added}`);
    console.log(`⏭️ Already Synced / Skipped: ${result.skipped}`);
    console.log('======================================================\n');
    
    process.exit(0);
  } catch (err) {
    console.error('❌ Sync failed:', err);
    process.exit(1);
  }
}

run();
