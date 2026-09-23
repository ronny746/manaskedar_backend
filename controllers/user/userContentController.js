const Media = require('../../models/Media');
const Banner = require('../../models/Banner');
const User = require('../../models/User');

exports.getBanners = async (req, res) => {
    try {
        const banners = await Banner.find().populate('mediaId');
        res.status(200).json(banners);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getHomeData = async (req, res) => {
    try {
        const userId = req.user.id;

        // 1. Fetch Featured (Banners)
        const banners = await Banner.find().populate('mediaId');

        // 2. Continue Watching (if history exists)
        const user = await User.findById(userId).populate({
            path: 'watchHistory.media',
            model: 'Media'
        });
        
        const continueWatchingItems = user ? user.watchHistory
            .filter(h => h.media != null)
            .sort((a, b) => b.updatedAt - a.updatedAt)
            .slice(0, 10)
            .map(h => {
                const m = h.media.toObject();
                m.id = m._id.toString(); 
                m.lastPosition = h.position;
                return m;
            }) : [];

        // 3. Categories (Requested Order: Continue, Video, Shorts, Audio)
        const videos = await Media.find({ type: 'video' }).limit(10).sort('-createdAt');
        const shorts = await Media.find({ type: 'short' }).limit(15).sort('-createdAt');
        const audio = await Media.find({ type: 'audio' }).limit(10).sort('-createdAt');

        // Build structured sections
        const sections = [
            { 
               title: 'continue_watching', 
               subtitle: 'resume_journey', 
               items: continueWatchingItems 
            },
            { 
                title: 'maha_movies', 
                subtitle: 'divine_cinema', 
                items: videos 
            },

            { 
                title: 'nada_audio', 
                subtitle: 'divine_sound', 
                items: audio 
            }
        ];

        // Filter and ensure all items have a string ID and compatible field names
        const finalSections = sections
            .filter(s => s.items && s.items.length > 0)
            .map(s => ({
                ...s,
                items: s.items.map(m => {
                    const item = (typeof m.toObject === 'function') ? m.toObject() : m;
                    const mapped = {
                        id: item._id ? item._id.toString() : (item.id || ''),
                        title: item.title || '',
                        imageUrl: item.thumbnail || item.imageUrl || '',
                        videoUrl: item.hlsUrl || item.url || item.videoUrl || '',
                        type: item.type || 'video',
                        description: item.description || '',
                        category: item.category || [],
                        duration: item.duration || 0,
                        isPremium: Boolean(item.isPremium),
                        language: item.language || 'Hindi',
                        tags: item.tags || [],
                        likesCount: Array.isArray(item.likes) ? item.likes.length : (item.likesCount || 0),
                        views: item.views || 0,
                        shares: item.shares || 0,
                        commentsCount: item.commentsCount || 0,
                        rating: item.rating || '4.5',
                        publishingYear: item.publishingYear || '2024',
                    };

                    return { ...item, ...mapped };
                })
            }));

        res.status(200).json({
            banners: banners.map(b => {
                const bj = (typeof b.toObject === 'function') ? b.toObject() : b;
                if (bj.mediaId) {
                    const media = (typeof bj.mediaId.toObject === 'function') ? bj.mediaId.toObject() : bj.mediaId;
                    const mediaIdStr = media._id ? media._id.toString() : (media.id || '');
                    
                    const mapped = {
                        id: mediaIdStr,
                        title: media.title || '',
                        imageUrl: bj.imageUrl || media.thumbnail || '',
                        videoUrl: media.hlsUrl || media.url || '',
                        type: media.type || 'video',
                        description: media.description || '',
                        category: media.category || [],
                        duration: media.duration || 0,
                        isPremium: Boolean(media.isPremium),
                        rating: media.rating || '4.5',
                        publishingYear: media.publishingYear || '2024',
                    };

                    return { ...bj, mediaId: { ...media, ...mapped } };
                }
                return bj;
            }),
            sections: finalSections
        });
    } catch (err) {
        console.error('Home Data Error:', err);
        res.status(500).json({ error: err.message });
    }
};

exports.getMedia = async (req, res) => {
    try {
        const { type, search } = req.query;
        let filter = {};
        if (type) {
            if (type === 'video' || type === 'movie') filter.type = { $in: ['video', 'movie'] };
            else if (type === 'short' || type === 'shorts') filter.type = { $in: ['short', 'shorts'] };
            else filter.type = type;
        }
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        
        const media = await Media.find(filter).sort('-createdAt');
        const mappedMedia = media.map(m => {
            const item = (typeof m.toObject === 'function') ? m.toObject() : m;
            const mapped = {
                id: item._id.toString(),
                title: item.title,
                imageUrl: item.thumbnail || '',
                videoUrl: item.hlsUrl || item.url || '',
                type: item.type
            };

            return { ...item, ...mapped };
        });
        res.status(200).json(mappedMedia);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
