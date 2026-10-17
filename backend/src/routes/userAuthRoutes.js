const express = require('express');
const router = express.Router();
const userAuthController = require('../controllers/userAuthController');

// Name + 8-Digit Password seamless login or register
router.post('/entry', userAuthController.entryLoginOrRegister);

// Current user profile
router.get('/me', userAuthController.getCurrentUser);

module.exports = router;
