const express = require('express');
const router = express.Router();
const notificationController = require('../../controllers/user/notificationController');
const authMiddleware = require('../../middleware/authMiddleware');

// Optional auth for notifications
router.get('/', (req, res, next) => {
    // try auth if token exists, else continue
    const authHeader = req.headers['authorization'];
    if (authHeader) {
        return authMiddleware(req, res, next);
    }
    next();
}, notificationController.getNotifications);

router.post('/register-token', authMiddleware, notificationController.registerFcmToken);

module.exports = router;
