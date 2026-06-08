const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
    mediaId: { type: mongoose.Schema.Types.ObjectId, ref: 'Media', required: true },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String, required: true },
    likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    parentCommentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Comment', default: null }, // Null means top-level comment
    createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Comment', commentSchema);
