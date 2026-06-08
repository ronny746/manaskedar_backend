const mongoose = require('mongoose');

const settingSchema = new mongoose.Schema({
    privacyPolicy: {
        type: String,
        default: ''
    },
    termsConditions: {
        type: String,
        default: ''
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Setting', settingSchema);
