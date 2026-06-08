const Media = require('../../models/Media');
const { enrichMediaWithUserData } = require('../../utils/mediaHelper');

// Get all shows
exports.getShows = async (req, res) => {
    try {
        const { search } = req.query;
        let filter = { type: 'show' };
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        const shows = await Media.find(filter).sort('-createdAt');
        const enriched = await enrichMediaWithUserData(shows, req.user?.id);
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single show by ID
exports.getShowById = async (req, res) => {
    try {
        const show = await Media.findOne({ _id: req.params.id, type: 'show' });
        if (!show) return res.status(404).json({ error: 'Show not found' });
        res.status(200).json(show);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
