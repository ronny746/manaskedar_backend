const Media = require('../../models/Media');

exports.toggleLike = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const userId = req.user.id;

        const media = await Media.findById(mediaId);
        if (!media) return res.status(404).json({ error: 'Media not found' });

        const likeIndex = media.likes.indexOf(userId);
        if (likeIndex > -1) {
            media.likes.splice(likeIndex, 1); // Unlike
        } else {
            media.likes.push(userId); // Like
        }
        await media.save();

        res.status(200).json({ message: 'Like updated', likesCount: media.likes.length, isLiked: likeIndex === -1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.incrementShare = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const media = await Media.findByIdAndUpdate(mediaId, { $inc: { shares: 1 } }, { returnDocument: 'after' });
        if (!media) return res.status(404).json({ error: 'Media not found' });
        res.status(200).json({ shares: media.shares });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.incrementView = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const media = await Media.findByIdAndUpdate(mediaId, { $inc: { views: 1 } }, { returnDocument: 'after' });
        if (!media) return res.status(404).json({ error: 'Media not found' });
        res.status(200).json({ views: media.views });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const Comment = require('../../models/Comment');

exports.getComments = async (req, res) => {
    try {
        const { mediaId } = req.params;
        // Fetch all comments and populate user details (name)
        const comments = await Comment.find({ mediaId }).populate('user', 'name phone').sort('-createdAt');
        
        // Return flat list to frontend, and let frontend build the tree, OR build the tree here
        // We'll send flat with parentCommentId so Flutter can group them natively
        res.status(200).json(comments);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.postComment = async (req, res) => {
    try {
        const { mediaId } = req.params;
        const { text, parentCommentId } = req.body;
        const userId = req.user.id; // From protect middleware

        if (!text) return res.status(400).json({ error: 'Text is required' });

        const newComment = await Comment.create({
            mediaId,
            user: userId,
            text,
            parentCommentId: parentCommentId || null
        });

        // Increment media overall counts
        await Media.findByIdAndUpdate(mediaId, { $inc: { commentsCount: 1 } });
        
        // Populate user before sending back so UI shows name immediately
        await newComment.populate('user', 'name phone');

        res.status(201).json(newComment);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleCommentLike = async (req, res) => {
    try {
        const { commentId } = req.params;
        const userId = req.user.id;

        const comment = await Comment.findById(commentId);
        if (!comment) return res.status(404).json({ error: 'Comment not found' });

        const likeIndex = comment.likes.indexOf(userId);
        if (likeIndex > -1) {
            comment.likes.splice(likeIndex, 1);
        } else {
            comment.likes.push(userId);
        }
        await comment.save();

        res.status(200).json({ message: 'Comment like updated', likesCount: comment.likes.length, isLiked: likeIndex === -1 });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
