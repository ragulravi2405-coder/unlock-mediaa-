require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });
const connectDB = require('../config/db');
const Media = require('../models/Media');
const Admin = require('../models/Admin');
const bcrypt = require('bcryptjs');
const { syncImagesFolder } = require('../services/imageSyncService');

const descriptions = {
  "Athletic Man in a Forest Stream.png": {
    price: 1,
    title: "Athletic Man in a Forest Stream",
    description: "🔥 [தமிழ்]: கவர்ச்சிகரமான மற்றும் கம்பீரமான காட்டு நீரோடை போட்டோஷூட்! குளிர்ந்த நீர்வீழ்ச்சி பின்னணியில் தத்ரூபமாகப் படம்பிடிக்கப்பட்ட ஹாட் மாஸ்டர் புகைப்படம்.\n\n⚡ [English]: Seductive & bold athletic physique photoshoot in a secluded forest stream. Crystal-clear uncompressed 8K master unblurred upon unlock.",
    category: "Photoshoot",
    tags: ["hot", "bold", "photoshoot", "fitness", "water", "forest", "tamil", "master"]
  },
  "Muscular Gym Selfie in Calvin Klein Briefs.png": {
    price: 99,
    title: "Muscular Gym Selfie in Calvin Klein Briefs",
    description: "💥 [தமிழ்]: மிரட்டலான ஜிம் உடலமைப்புடன் கூடிய மிக கவர்ச்சியான செக்ஸி செல்ஃபி! Calvin Klein உடையில் கவர்ச்சியின் உச்சகட்ட மாஸ்டர் போஸ்.\n\n⚡ [English]: Alluring & ripped gym physique selfie in Calvin Klein briefs. Steamy, aesthetic uncompressed master photo delivered instantly upon unlock.",
    category: "Photoshoot",
    tags: ["gym", "hot", "calvin-klein", "muscular", "fitness", "sexy", "master"]
  },
  "Muscular Man Standing on Dusty Ground.png": {
    price: 109,
    title: "Muscular Man Standing on Dusty Ground",
    description: "🔥 [தமிழ்]: புழுதி படிந்த திறந்தவெளியில் எடுக்கப்பட்ட கம்பீரமான மற்றும் கவர்ச்சிகரமான ஹாட் அவுட்டோர் போஸ்!\n\n⚡ [English]: Rugged, masculine & sensual outdoor photoshoot. Striking athletic posture on sun-baked earth with ultra-high dynamic range.",
    category: "Photoshoot",
    tags: ["outdoor", "hot", "rugged", "muscular", "photoshoot", "aesthetic"]
  },
  "Riverside Portrait in Shallow Waters.png": {
    price: 119,
    title: "Riverside Portrait in Shallow Waters",
    description: "🌊 [தமிழ்]: ஆற்று நீரில் நனைந்த கண்கவர் ஹாட் போஸ்! தெளிந்த நதிநீரில் கவர்ச்சிகரமான தோற்றத்துடன் கூடிய பிரத்யேக புகைப்படம்.\n\n⚡ [English]: Sensual riverside portrait captured in crystal shallow waters. Wet, steamy aesthetic and rich natural lighting. Full resolution unblurred master.",
    category: "Photoshoot",
    tags: ["riverside", "water", "hot", "wet", "photoshoot", "alluring"]
  },
  "Sunlit Riverside Portrait.png": {
    price: 129,
    title: "Sunlit Riverside Portrait",
    description: "☀️ [தமிழ்]: தங்க நிற சூரிய ஒளியில் மின்னும் கவர்ச்சியான நதிக்கரை போஸ்! ஆண்மையின் அழகை தத்ரூபமாக காட்டும் ஹாட் மாஸ்டர் புகைப்படம்.\n\n⚡ [English]: Sun-drenched hot & bold riverside portrait. Golden hour sunlight highlighting sculpted physique in full uncompressed master resolution.",
    category: "Photoshoot",
    tags: ["sunlit", "hot", "riverside", "golden-hour", "physique", "sexy"]
  },
  "Wet Towel Portrait by the Riverside.png": {
    price: 139,
    title: "Wet Towel Portrait by the Riverside",
    description: "🔥 [தமிழ்]: நனைந்த டவலுடன் நதிக்கரையில் நிற்கும்போது எடுக்கப்பட்ட உச்சகட்ட செக்ஸி மற்றும் ஹாட் போஸ்!\n\n⚡ [English]: Provocative & steamy wet towel riverside portrait. Seductive post-swim atmosphere captured in breathtaking uncompressed clarity.",
    category: "Photoshoot",
    tags: ["wet-towel", "hot", "sexy", "riverside", "bold", "master"]
  },
  "Young Man in a Forest Stream.png": {
    price: 145,
    title: "Young Man in a Forest Stream",
    description: "🌿 [தமிழ்]: அடர்ந்த வன நீரோடையில் கவர்ச்சிகரமான ஹாட் போஸ்! இயற்கை எழிலோடு கூடிய இளைஞனின் செக்ஸியான அன்சென்சார் மாஸ்டர் போட்டோ.\n\n⚡ [English]: Sultry & aesthetic forest stream photoshoot. Pristine wilderness meets bold physique. Full unblurred uncompressed master file upon unlock.",
    category: "Photoshoot",
    tags: ["forest", "stream", "hot", "young", "nature", "alluring"]
  },
  "Young Man’s Riverside Selfie.png": {
    price: 149,
    title: "Young Man’s Riverside Selfie",
    description: "📸 [தமிழ்]: மிக நெருக்கமான பார்வையில் எடுக்கப்பட்ட ஹாட் அண்ட் செக்ஸி நதிக்கரை செல்ஃபி!\n\n⚡ [English]: Intimate, seductive close-up riverside selfie with captivating gaze. Master resolution unblurred original file upon unlock.",
    category: "Photoshoot",
    tags: ["selfie", "hot", "sexy", "riverside", "intimate", "master"]
  }
};

async function initAtlas() {
  try {
    await connectDB();
    console.log('✅ Connected to MongoDB Atlas successfully!');

    // 1. Initialize Admin
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
      console.log(`✅ [Admin] Created admin account in MongoDB Atlas: "${adminUsername}"`);
    } else {
      existingAdmin.username = adminUsername;
      existingAdmin.password = hashedPassword;
      existingAdmin.name = 'Rahul';
      await existingAdmin.save();
      console.log(`✅ [Admin] Updated admin account in MongoDB Atlas: "${adminUsername}"`);
    }

    // 2. Sync folder add_images_here into Atlas DB
    console.log('🔄 Syncing images from "add_images_here"...');
    const syncRes = await syncImagesFolder();
    console.log(`📸 Sync result: added ${syncRes.added}, skipped ${syncRes.skipped}`);

    // 3. Clean and apply Tamil/English descriptions & prices
    console.log('📝 Applying Tamil & English descriptions, prices (₹1, ₹99-₹149)...');
    for (const [fileName, data] of Object.entries(descriptions)) {
      const updated = await Media.findOneAndUpdate(
        { originalFileName: fileName },
        {
          $set: {
            title: data.title,
            description: data.description,
            price: data.price,
            category: data.category,
            tags: data.tags,
            mediaType: 'photo',
            isPublished: true
          }
        },
        { new: true }
      );
      if (updated) {
        console.log(`  ⭐ Updated: "${updated.title}" -> ₹${updated.price}`);
      } else {
        console.log(`  ⚠️ Not found yet: ${fileName}`);
      }
    }

    // 4. Verification
    const count = await Media.countDocuments();
    const admins = await Admin.find({}, 'username email role');
    console.log(`\n🎉 Atlas setup complete! Total media items in MongoDB Atlas: ${count}`);
    console.log(`👑 Admins in Atlas:`, admins);

    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing Atlas:', err);
    process.exit(1);
  }
}

initAtlas();
