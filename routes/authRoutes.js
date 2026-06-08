const express = require('express');
const router = express.Router();
const { sendOtp, verifyOtp, adminLogin, logout, adminRegister, getProfile, updateProfile } = require('../controllers/authController');
const { protect } = require('../middleware/auth');

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtp);
router.post('/admin-login', adminLogin);
router.post('/admin-register', adminRegister);
router.post('/logout', protect, logout);

router.get('/profile', protect, getProfile);
router.put('/profile', protect, updateProfile);

module.exports = router;
