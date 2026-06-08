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
               title: 'ansh_shorts', 
               subtitle: 'divine_spark', 
               items: shorts 
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
                        id: item._id.toString(),
                        title: item.title,
                        imageUrl: item.thumbnail || '',
                        videoUrl: item.url || '',
                        type: item.type
                    };

                    if (item.type === 'video') {
                        return { ...item, ...mapped };
                    }
                    return mapped;
                })
            }));

        res.status(200).json({
            banners: banners.map(b => {
                const bj = b.toObject();
                if (bj.mediaId) {
                    const media = bj.mediaId;
                    const mediaIdStr = media._id.toString();
                    
                    const mapped = {
                        id: mediaIdStr,
                        title: media.title,
                        imageUrl: bj.imageUrl || media.thumbnail || '',
                        videoUrl: media.url || '',
                        type: media.type
                    };

                    // Even for banners, if it's a video, send full data
                    if (media.type === 'video') {
                        return { ...bj, mediaId: { ...media, ...mapped } };
                    }
                    return { ...bj, mediaId: mapped };
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
        if (type) filter.type = type;
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        
        const media = await Media.find(filter);
        const mappedMedia = media.map(m => {
            const item = m.toObject();
            const mapped = {
                id: item._id.toString(),
                title: item.title,
                imageUrl: item.thumbnail || '',
                videoUrl: item.url || '',
                type: item.type
            };

            if (item.type === 'video') {
                return { ...item, ...mapped };
            }
            return mapped;
        });
        res.status(200).json(mappedMedia);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
