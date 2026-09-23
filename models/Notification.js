const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
    title: { type: String, required: true },
    body: { type: String, required: true },
    imageUrl: { type: String, default: '' },
    mediaId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Media',
        default: null
    },
    mediaType: {
        type: String,
        enum: ['movie', 'show', 'short', 'shorts', 'audio', 'banner', 'general'],
        default: 'general'
    },
    route: { type: String, default: '/details' },
    targetUrl: { type: String, default: '' },
    isBroadcast: { type: Boolean, default: true },
    targetUser: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Notification', notificationSchema);
