const mongoose = require('mongoose');

const mediaSchema = new mongoose.Schema({
    title: { type: String, required: true },

    type: {
        type: String,
        enum: ['video', 'audio', 'short'],
        required: true
    },

    description: String,

    thumbnail: String,

    url: { type: String, required: true }, // S3 URL

    duration: Number, // seconds

    category: [String], // ["action", "drama"]

    language: String,

    tags: [String],

    isPremium: { type: Boolean, default: false },

    views: { type: Number, default: 0 },

    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    dislikes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],

    shares: { type: Number, default: 0 },
    commentsCount: { type: Number, default: 0 },
    rating: { type: String, default: "4.5" },
    publishingYear: { type: String, default: "2024" },

    uploadedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },

    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Media', mediaSchema);
