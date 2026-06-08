const User = require('../models/User');

exports.enrichMediaWithUserData = async (mediaList, userId) => {
    if (!userId) return mediaList;

    const user = await User.findById(userId);
    if (!user) return mediaList;

    const favSet = new Set(user.favorites.map(f => f.toString()));
    const historyMap = new Map();
    user.watchHistory.forEach(h => {
        historyMap.set(h.media.toString(), h.position);
    });

    return mediaList.map(media => {
        const mediaObj = media.toObject ? media.toObject() : media;
        const mediaId = mediaObj._id.toString();
        
        return {
            ...mediaObj,
            isFavorite: favSet.has(mediaId),
            lastPosition: historyMap.has(mediaId) ? historyMap.get(mediaId) : 0
        };
    });
};

exports.enrichSingleMediaWithUserData = async (media, userId) => {
    if (!userId) return media;

    const user = await User.findById(userId);
    if (!user) return media;

    const mediaObj = media.toObject ? media.toObject() : media;
    const mediaId = mediaObj._id.toString();

    return {
        ...mediaObj,
        isFavorite: user.favorites.some(f => f.toString() === mediaId),
        lastPosition: user.watchHistory.find(h => h.media.toString() === mediaId)?.position || 0
    };
};
