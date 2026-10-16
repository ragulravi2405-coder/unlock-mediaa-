const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { verifyAdminToken } = require('../middleware/auth');
const upload = require('../middleware/upload');
const { adminLoginLimiter } = require('../middleware/rateLimiters');

// Authentication
router.post('/auth/login', adminLoginLimiter, adminController.adminLogin);

// Protected Admin Endpoints
router.use(verifyAdminToken);

router.get('/dashboard/stats', adminController.getDashboardStats);
router.get('/media', adminController.getAdminMediaList);

// Upload media: accepts previewFile and originalFile
router.post('/media', upload.fields([
  { name: 'previewFile', maxCount: 1 },
  { name: 'originalFile', maxCount: 1 }
]), adminController.createMedia);

router.put('/media/:id', adminController.updateMedia);
router.delete('/media/:id', adminController.deleteMedia);

router.get('/orders', adminController.getOrdersList);
router.post('/orders/:id/refund', adminController.refundOrder);

module.exports = router;
