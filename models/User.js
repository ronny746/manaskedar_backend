const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    token: { type: String, required: true },
    lastUsed: { type: Date, default: Date.now }
});

const userSchema = new mongoose.Schema({
    name: { type: String, default: 'User' },
    email: { type: String, unique: true, sparse: true },
    phone: { type: String, required: true, unique: true },
    city: { type: String, default: '' },
    imageUrl: { type: String, default: '' },
    otp: { type: String },
    otpExpiry: { type: Date },
    isAdmin: { type: Boolean, default: false },
    isPremium: { type: Boolean, default: false },
    lastActive: { type: Date, default: Date.now },
    sessions: [sessionSchema], // Track up to 3 sessions
    favorites: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    watchHistory: [{
        media: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
        position: { type: Number, default: 0 },
        updatedAt: { type: Date, default: Date.now }
    }],
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('User', userSchema);
