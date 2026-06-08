const mongoose = require('mongoose');

const bannerSchema = new mongoose.Schema({
    imageUrl: { type: String, required: true },
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media' },
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Banner', bannerSchema);
