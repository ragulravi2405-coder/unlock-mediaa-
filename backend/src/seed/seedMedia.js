require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const fs = require('fs');
const path = require('path');
const connectDB = require('../config/db');
const Media = require('../models/Media');
const Admin = require('../models/Admin');
const { ORIGINALS_DIR, PREVIEWS_DIR } = require('../services/storageService');

// Sample real-world photos & videos for the Pay-to-Unlock platform
const sampleMedia = [
  {
    title: 'Himalayan Golden Sunrise - High Resolution Panorama',
    slug: 'himalayan-golden-sunrise-panorama',
    description: 'An ultra-high-resolution 8K landscape photograph captured at 14,000 feet in Ladakh during the first light of dawn. Includes RAW dynamic range and rich golden alpine glow. Unlocks the uncompressed master file.',
    mediaType: 'photo',
    category: 'Landscapes',
    tags: ['mountains', 'sunrise', 'ladakh', 'himalayas', 'nature', '8k'],
    price: 99,
    currency: 'INR',
    previewUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?w=800&q=70&auto=format',
    originalFileKey: 'himalaya_original_master.jpg',
    originalFileName: 'Himalayan_Sunrise_Master_8K.jpg',
    mimeType: 'image/jpeg',
    fileSize: 14820350,
    dimensions: { width: 7680, height: 4320 },
    allowDownload: true,
    isPublished: true,
    viewsCount: 142,
    unlockCount: 23
  },
  {
    title: 'Cyberpunk Neon Metropolis - 4K Cinematic Drone Reel',
    slug: 'cyberpunk-neon-metropolis-drone-reel',
    description: 'Exclusive 4K 60FPS cinematic drone sequence gliding through futuristic skyscraper canyons in neon rain. Includes ProRes color grade and master audio design. Perfect for commercial editing, music visuals, and background projections.',
    mediaType: 'video',
    category: 'Cinematic',
    tags: ['drone', 'city', 'neon', 'cyberpunk', 'night', '4k'],
    price: 99,
    currency: 'INR',
    previewUrl: 'https://images.unsplash.com/photo-1519501025264-65ba15a82390?w=800&q=70&auto=format',
    originalFileKey: 'cyberpunk_city_drone_master.mp4',
    originalFileName: 'Cyberpunk_City_4K60_Master.mp4',
    mimeType: 'video/mp4',
    fileSize: 45290120,
    dimensions: { width: 3840, height: 2160 },
    duration: 38,
    allowDownload: true,
    isPublished: true,
    viewsCount: 289,
    unlockCount: 45
  },
  {
    title: 'Ethereal Forest Waterfall in Heavy Mist',
    slug: 'ethereal-forest-waterfall-heavy-mist',
    description: 'Award-winning long exposure study of a secluded cascade in the Western Ghats rainforest. Rich emerald moss, silky water textures, and volumetric sunbeams breaking through canopy fog.',
    mediaType: 'photo',
    category: 'Nature',
    tags: ['waterfall', 'forest', 'rainforest', 'long-exposure', 'green'],
    price: 99,
    currency: 'INR',
    previewUrl: 'https://images.unsplash.com/photo-1432405972618-c60b0225b8f9?w=800&q=70&auto=format',
    originalFileKey: 'waterfall_master_hires.jpg',
    originalFileName: 'Forest_Waterfall_Master_Ultra.jpg',
    mimeType: 'image/jpeg',
    fileSize: 18920100,
    dimensions: { width: 6000, height: 4000 },
    allowDownload: true,
    isPublished: true,
    viewsCount: 98,
    unlockCount: 18
  },
  {
    title: 'Ocean Bioluminescence - Slow Motion Drone Footage',
    slug: 'ocean-bioluminescence-slow-motion-drone',
    description: 'Rare nighttime aerial capture of bioluminescent phytoplankton lighting up breaking waves along a tropical shoreline in electric neon blue. Captured on specialized ultra-low-light cinema sensors.',
    mediaType: 'video',
    category: 'Ocean',
    tags: ['ocean', 'bioluminescence', 'waves', 'night', 'aerial'],
    price: 99,
    currency: 'INR',
    previewUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&q=70&auto=format',
    originalFileKey: 'ocean_bioluminescence_reel.mp4',
    originalFileName: 'Ocean_Bioluminescent_Cinema.mp4',
    mimeType: 'video/mp4',
    fileSize: 38100200,
    dimensions: { width: 3840, height: 2160 },
    duration: 42,
    allowDownload: true,
    isPublished: true,
    viewsCount: 312,
    unlockCount: 52
  },
  {
    title: 'Minimalist Architecture - Desert Sanctuary',
    slug: 'minimalist-architecture-desert-sanctuary',
    description: 'Clean geometry, brutalist concrete lines, and warm afternoon shadows at an award-winning private desert villa. Architectural digest master resolution with corrected perspective verticals.',
    mediaType: 'photo',
    category: 'Architecture',
    tags: ['architecture', 'minimal', 'modern', 'brutalist', 'shadows'],
    price: 99,
    currency: 'INR',
    previewUrl: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&q=70&auto=format',
    originalFileKey: 'desert_villa_master.jpg',
    originalFileName: 'Desert_Sanctuary_Architectural_8K.jpg',
    mimeType: 'image/jpeg',
    fileSize: 12400300,
    dimensions: { width: 7000, height: 4667 },
    allowDownload: true,
    isPublished: true,
    viewsCount: 84,
    unlockCount: 12
  },
  {
    title: 'Northern Lights Aurora Borealis Time-Lapse Master',
    slug: 'northern-lights-aurora-borealis-timelapse',
    description: 'Hyper-vivid Arctic aurora storm dancing across the snow-covered peaks of Lofoten, Norway. 8K ProRes time-lapse sequence captured over 6 hours of solar flare activity.',
    mediaType: 'video',
    category: 'Cinematic',
    tags: ['aurora', 'northern-lights', 'norway', 'timelapse', 'arctic'],
    price: 99,
    currency: 'INR',
    previewUrl: 'https://images.unsplash.com/photo-1531366936337-7c912a4589a7?w=800&q=70&auto=format',
    originalFileKey: 'aurora_borealis_8k_master.mp4',
    originalFileName: 'Aurora_Lofoten_8K_Master.mp4',
    mimeType: 'video/mp4',
    fileSize: 52400000,
    dimensions: { width: 3840, height: 2160 },
    duration: 30,
    allowDownload: true,
    isPublished: true,
    viewsCount: 420,
    unlockCount: 71
  },
  {
    title: 'Moody Vintage Portrait - Studio Film Stock Emulation',
    slug: 'moody-vintage-portrait-film-stock',
    description: 'Editorial high-fashion studio portrait rendered with organic 35mm grain, subdued highlights, and deep filmic skin tones. Perfect for wall prints and luxury editorial curation.',
    mediaType: 'photo',
    category: 'Portraits',
    tags: ['portrait', 'fashion', '35mm', 'vintage', 'studio'],
    price: 99,
    currency: 'INR',
    previewUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=800&q=70&auto=format',
    originalFileKey: 'vintage_portrait_master.jpg',
    originalFileName: 'Vintage_Editorial_Portrait_Full.jpg',
    mimeType: 'image/jpeg',
    fileSize: 16200000,
    dimensions: { width: 6240, height: 4160 },
    allowDownload: true,
    isPublished: true,
    viewsCount: 176,
    unlockCount: 34
  },
  {
    title: 'Abstract Golden Fluid Dynamics Macro Clip',
    slug: 'abstract-golden-fluid-dynamics-macro',
    description: 'Mesmerizing 4K macro video of swirling liquid gold, magnetic ferrofluid, and metallic pigment currents reacting in zero gravity chambers. Seamlessly loopable ambient video.',
    mediaType: 'video',
    category: 'Abstract',
    tags: ['abstract', 'gold', 'fluid', 'macro', 'loop'],
    price: 99,
    currency: 'INR',
    previewUrl: 'https://images.unsplash.com/photo-1518770660439-4636190af475?w=800&q=70&auto=format',
    originalFileKey: 'golden_fluid_macro_loop.mp4',
    originalFileName: 'Golden_Fluid_Dynamics_4K.mp4',
    mimeType: 'video/mp4',
    fileSize: 31200000,
    dimensions: { width: 3840, height: 2160 },
    duration: 25,
    allowDownload: true,
    isPublished: true,
    viewsCount: 220,
    unlockCount: 39
  }
];

async function seedDatabase() {
  try {
    await connectDB();
    console.log('[Seed] Seeding database...');

    // 1. Create default admin if not exists
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
      console.log(`[Seed] Created admin account: ${adminEmail} (password: ${defaultPassword})`);
    } else {
      console.log(`[Seed] Admin account already exists: ${adminEmail}`);
    }

    // 2. Ensure mock sample files exist on disk for local storage mode
    sampleMedia.forEach(media => {
      const originalPath = path.join(ORIGINALS_DIR, media.originalFileKey);
      if (!fs.existsSync(originalPath)) {
        // Create a mock master file with sample header so streaming succeeds
        const sampleHeader = `[Protected Master Asset: ${media.title} - Size: ${media.fileSize} bytes]`;
        fs.writeFileSync(originalPath, Buffer.from(sampleHeader.repeat(200)));
      }
    });

    // 3. Upsert media items
    for (const item of sampleMedia) {
      await Media.findOneAndUpdate(
        { slug: item.slug },
        item,
        { upsert: true, new: true }
      );
    }

    console.log(`[Seed] Successfully seeded ${sampleMedia.length} media items with ₹99 default pricing!`);
    process.exit(0);
  } catch (err) {
    console.error('[Seed Error]', err);
    process.exit(1);
  }
}

if (require.main === module) {
  seedDatabase();
}

module.exports = { seedDatabase, sampleMedia };
