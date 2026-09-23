const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/user/notificationController');
const { protect, optionalProtect } = require('../../middleware/auth');

// Optional auth for fetching notifications
router.get('/', optionalProtect, notificationController.getNotifications);

// Register FCM token (optional or protected)
router.post('/register-token', optionalProtect, notificationController.registerFcmToken);

module.exports = router;
