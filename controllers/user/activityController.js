const User = require('../../models/User');
const Media = require('../../models/Media');

exports.toggleFavorite = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mediaId } = req.params;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        const favIndex = user.favorites.indexOf(mediaId);
        if (favIndex > -1) {
            user.favorites.splice(favIndex, 1);
        } else {
            user.favorites.push(mediaId);
        }
        await user.save();

        res.status(200).json({ 
            message: favIndex > -1 ? 'Removed from favorites' : 'Added to favorites',
            isFavorite: favIndex === -1 
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getFavorites = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate('favorites');
        res.status(200).json(user.favorites);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateWatchHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const { mediaId, position } = req.body;

        const user = await User.findById(userId);
        if (!user) return res.status(404).json({ error: 'User not found' });

        // Find if already exists
        const historyIndex = user.watchHistory.findIndex(h => h.media.toString() === mediaId);
        
        if (historyIndex > -1) {
            user.watchHistory[historyIndex].position = position;
            user.watchHistory[historyIndex].updatedAt = Date.now();
        } else {
            user.watchHistory.push({ media: mediaId, position });
        }

        // Limit history to 20 items for performance
        if (user.watchHistory.length > 20) {
            user.watchHistory.sort((a, b) => b.updatedAt - a.updatedAt);
            user.watchHistory = user.watchHistory.slice(0, 20);
        }

        await user.save();
        res.status(200).json({ message: 'History updated' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getWatchHistory = async (req, res) => {
    try {
        const userId = req.user.id;
        const user = await User.findById(userId).populate({
            path: 'watchHistory.media',
            model: 'Media'
        });

        // Filter out any null media (if media was deleted)
        const history = user.watchHistory
            .filter(h => h.media !== null)
            .sort((a, b) => b.updatedAt - a.updatedAt);

        res.status(200).json(history);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
