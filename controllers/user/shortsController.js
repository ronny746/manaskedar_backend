const Media = require('../../models/Media');
const { enrichMediaWithUserData } = require('../../utils/mediaHelper');

// Get all shorts
exports.getShorts = async (req, res) => {
    try {
        const shorts = await Media.find({ type: { $in: ['short', 'shorts'] } }).sort('-createdAt');
        const enriched = await enrichMediaWithUserData(shorts, req.user?.id);
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single short by ID
exports.getShortById = async (req, res) => {
    try {
        const short = await Media.findOne({ _id: req.params.id, type: { $in: ['short', 'shorts'] } });
        if (!short) return res.status(404).json({ error: 'Short not found' });
        res.status(200).json(short);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
