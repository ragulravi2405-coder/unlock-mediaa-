const User = require('../models/User');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'pay_unlock_secure_jwt_secret_dev';

/**
 * POST /api/user-auth/entry
 * Allows any visitor to enter with their Name and 8-digit password (saves to MongoDB)
 */
exports.entryLoginOrRegister = async (req, res) => {
  try {
    const { name, password } = req.body;

    const trimmedName = (name && typeof name === 'string') ? name.trim() : '';
    const trimmedPassword = (password && typeof password === 'string') ? password.trim() : '';

    if (!trimmedName || trimmedName.length < 2) {
      return res.status(400).json({
        error: 'உங்கள் பெயரை உள்ளிடவும் (Please enter your name with at least 2 characters).'
      });
    }

    if (!trimmedPassword || trimmedPassword.length < 8) {
      return res.status(400).json({
        error: 'பாஸ்வேர்ட் குறைந்தது 8 இலக்கங்கள்/எழுத்துக்கள் இருக்க வேண்டும் (Password must be at least 8 digits/characters).'
      });
    }

    // Generate normalized username
    const normalizedUsername = trimmedName.toLowerCase().replace(/[^a-z0-9]/g, '_');

    // Find existing user by username or exact name
    let user = await User.findOne({
      $or: [
        { username: normalizedUsername },
        { name: { $regex: new RegExp(`^${trimmedName}$`, 'i') } }
      ]
    }).select('+password');

    let isNewUser = false;

    if (user) {
      // User exists -> verify password
      const isMatch = await user.comparePassword(trimmedPassword);
      if (!isMatch) {
        return res.status(401).json({
          error: 'இந்த பெயருக்கான 8-இலக்க பாஸ்வேர்ட் தவறானது. சரியான பாஸ்வேர்டை உள்ளிடவும் (Incorrect 8-digit password for this name).'
        });
      }
      user.lastLogin = new Date();
      await user.save();
    } else {
      // New user -> register into MongoDB with hashed password
      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(trimmedPassword, salt);

      // Handle duplicate username edge case
      let finalUsername = normalizedUsername;
      const count = await User.countDocuments({ username: normalizedUsername });
      if (count > 0) {
        finalUsername = `${normalizedUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await User.create({
        name: trimmedName,
        username: finalUsername,
        password: hashedPassword,
        lastLogin: new Date()
      });

      isNewUser = true;
      console.log(`[User Registered] New user registered in MongoDB: Name="${user.name}", Username="${user.username}"`);
    }

    // Generate JWT token
    const token = jwt.sign(
      { id: user._id, name: user.name, username: user.username },
      JWT_SECRET,
      { expiresIn: '60d' }
    );

    return res.json({
      success: true,
      isNewUser,
      message: isNewUser
        ? `வரவேற்கிறோம் ${user.name}! உங்கள் கணக்கு வெற்றிகரமாக உருவாக்கப்பட்டது.`
        : `மீண்டும் வருக ${user.name}! வெற்றிகரமாக உள்நுழைந்துள்ளீர்கள்.`,
      token,
      user: {
        id: user._id,
        name: user.name,
        username: user.username
      }
    });
  } catch (err) {
    console.error('[User Auth Entry Error]', err);
    return res.status(500).json({ error: 'உள்நுழைவு தோல்வி: ' + err.message });
  }
};

/**
 * GET /api/user-auth/me
 * Retrieves current logged-in user profile
 */
exports.getCurrentUser = async (req, res) => {
  try {
    const authHeader = req.headers['authorization'];
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.id).populate('purchases.mediaId', 'title previewUrl price mediaType');
    if (!user) {
      return res.status(404).json({ error: 'User not found in database' });
    }

    return res.json({
      success: true,
      user: {
        id: user._id,
        name: user.name,
        username: user.username,
        purchases: user.purchases || []
      }
    });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
};
