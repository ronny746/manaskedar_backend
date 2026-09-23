const admin = require('firebase-admin');
const { getMessaging } = require('firebase-admin/messaging');
const path = require('path');
const fs = require('fs');
const Notification = require('../models/Notification');
const User = require('../models/User');

// 🔑 Initialize Firebase Admin SDK
let serviceAccount = null;
const defaultPath = path.join(__dirname, '../config/firebase-service-account.json');
const customPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

try {
    if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        // Option 1: Loaded directly from .env (useful for cloud/CI/CD deployments)
        serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT === 'string'
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : process.env.FIREBASE_SERVICE_ACCOUNT;
    } else if (customPath && fs.existsSync(customPath)) {
        // Option 2: Custom path specified in .env
        serviceAccount = require(customPath);
    } else if (fs.existsSync(defaultPath)) {
        // Option 3: Direct file in config/firebase-service-account.json
        serviceAccount = require(defaultPath);
    }

    if (serviceAccount && !admin.getApps().length) {
        admin.initializeApp({
            credential: admin.cert(serviceAccount)
        });
        console.log(`[FIREBASE ADMIN] Initialized successfully for project: ${serviceAccount.project_id}`);
    } else if (!admin.getApps().length) {
        console.warn('[FIREBASE ADMIN] No service account credentials found (checked config/firebase-service-account.json and FIREBASE_SERVICE_ACCOUNT in .env)');
    }
} catch (err) {
    console.error('[FIREBASE ADMIN INIT ERROR]', err.message);
}

/**
 * Send push notification and create Notification record in MongoDB
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
    mediaType = 'movie',
    route = '/details',
    targetUrl = '',
    targetUserId = null
}) => {
    try {
        // 1. Save to Database for In-App Notification Center
        const notificationRecord = await Notification.create({
            title,
            body,
            imageUrl: imageUrl || '',
            mediaId: mediaId || null,
            mediaType: mediaType || 'movie',
            route: route || '/details',
            targetUrl: targetUrl || '',
            isBroadcast: !targetUserId,
            targetUser: targetUserId || null
        });

        console.log(`[NOTIFICATION STORED] ID: ${notificationRecord._id} - "${title}" -> Route: ${route}`);

        // 2. Broadcast via Firebase Admin Cloud Messaging
        if (admin.getApps().length > 0) {
            try {
                const messaging = getMessaging();
                const messagePayload = {
                    notification: {
                        title: String(title),
                        body: String(body),
                        ...(imageUrl ? { imageUrl: String(imageUrl) } : {})
                    },
                    data: {
                        mediaId: mediaId ? String(mediaId) : '',
                        mediaType: String(mediaType || 'movie'),
                        route: String(route || '/details'),
                        targetUrl: String(targetUrl || ''),
                        title: String(title),
                        body: String(body),
                        click_action: 'FLUTTER_NOTIFICATION_CLICK'
                    },
                    android: {
                        priority: 'high',
                        notification: {
                            sound: 'default',
                            channelId: 'manaskedar_channel',
                            clickAction: 'FLUTTER_NOTIFICATION_CLICK',
                            ...(imageUrl ? { imageUrl: String(imageUrl) } : {})
                        }
                    },
                    apns: {
                        payload: {
                            aps: {
                                sound: 'default',
                                badge: 1,
                                contentAvailable: true
                            }
                        },
                        fcmOptions: {
                            ...(imageUrl ? { imageUrl: String(imageUrl) } : {})
                        }
                    },
                    topic: 'all_users'
                };

                const response = await messaging.send(messagePayload);
                console.log(`[FCM PUSH SENT] Broadcast to topic "all_users" - Message ID: ${response}`);
            } catch (fcmErr) {
                console.error(`[FCM BROADCAST ERROR]`, fcmErr.message);
            }
        } else {
            console.warn('[FCM WARNING] Firebase Admin SDK is not initialized; notification saved to DB only.');
        }

        return notificationRecord;
    } catch (err) {
        console.error('[SEND NOTIFICATION ERROR]', err.message);
        return null;
    }
};

/**
 * Check if Firebase Admin SDK is initialized and ready
 */
exports.isFirebaseReady = () => {
    return Boolean(admin.getApps().length > 0);
};
