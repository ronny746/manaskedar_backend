const Media = require('../../models/Media');
const { enrichMediaWithUserData } = require('../../utils/mediaHelper');

// Get all audios
exports.getAudios = async (req, res) => {
    try {
        const { search } = req.query;
        let filter = { type: 'audio' };
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        const audios = await Media.find(filter).sort('-createdAt');
        const enriched = await enrichMediaWithUserData(audios, req.user?.id);
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single audio by ID
exports.getAudioById = async (req, res) => {
    try {
        const audio = await Media.findOne({ _id: req.params.id, type: 'audio' });
        if (!audio) return res.status(404).json({ error: 'Audio not found' });
        res.status(200).json(audio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
