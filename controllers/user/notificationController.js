const Notification = require('../../models/Notification');
const User = require('../../models/User');

// Get all notifications for user / broadcast
exports.getNotifications = async (req, res) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const query = {
            $or: [
                { isBroadcast: true },
                ...(userId ? [{ targetUser: userId }] : [])
            ]
        };

        const notifications = await Notification.find(query)
            .populate('mediaId', 'title thumbnail url type hlsUrl')
            .sort({ createdAt: -1 })
            .limit(50);

        res.status(200).json(notifications);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Register or update FCM Token
exports.registerFcmToken = async (req, res) => {
    try {
        const { fcmToken } = req.body;
        if (!fcmToken) {
            return res.status(400).json({ error: 'fcmToken is required' });
        }

        const userId = req.user?.id || req.user?._id;
        if (userId) {
            await User.findByIdAndUpdate(userId, {
                $set: { fcmToken },
                $addToSet: { fcmTokens: fcmToken }
            });
        }

        res.status(200).json({ success: true, message: 'FCM Token registered successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
