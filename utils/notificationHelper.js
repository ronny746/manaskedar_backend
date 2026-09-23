const Notification = require('../models/Notification');
const User = require('../models/User');

/**
 * Send push notification and create Notification record
 * @param {Object} data
 * @param {string} data.title
 * @param {string} data.body
 * @param {string} [data.imageUrl]
 * @param {string} [data.mediaId]
 * @param {string} [data.mediaType]
 * @param {string} [data.route]
 * @param {string} [data.targetUrl]
 * @param {string} [data.targetUserId]
 */
exports.sendNotification = async ({
    title,
    body,
    imageUrl = '',
    mediaId = null,
    mediaType = 'general',
    route = '/details',
    targetUrl = '',
    targetUserId = null
}) => {
    try {
        // 1. Save to Database for In-App Notifications
        const notificationRecord = await Notification.create({
            title,
            body,
            imageUrl,
            mediaId,
            mediaType,
            route,
            targetUrl,
            isBroadcast: !targetUserId,
            targetUser: targetUserId
        });

        console.log(`[NOTIFICATION CREATED] ID: ${notificationRecord._id} - "${title}" -> Route: ${route}`);

        // 2. Broadcast via FCM (if firebase-admin is installed/configured)
        try {
            // Check if firebase-admin is available
            const admin = require('firebase-admin');
            if (admin.apps && admin.apps.length > 0) {
                const messagePayload = {
                    notification: {
                        title,
                        body,
                        ...(imageUrl ? { imageUrl } : {})
                    },
                    data: {
                        mediaId: mediaId ? String(mediaId) : '',
                        mediaType: String(mediaType || 'movie'),
                        route: String(route || '/details'),
                        targetUrl: String(targetUrl || ''),
                        click_action: 'FLUTTER_NOTIFICATION_CLICK'
                    },
                    topic: 'all_users'
                };

                await admin.messaging().send(messagePayload);
                console.log(`[FCM BROADCAST SENT] Topic: all_users - "${title}"`);
            }
        } catch (fcmErr) {
            // Firebase Admin might not be configured, which is fine - in-app notification is saved
            console.log(`[FCM NOTIFICATION LOG] (Saved to DB): ${fcmErr.message}`);
        }

        return notificationRecord;
    } catch (err) {
        console.error('[SEND NOTIFICATION ERROR]', err.message);
        return null;
    }
};
