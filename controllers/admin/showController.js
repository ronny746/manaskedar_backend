const Media = require('../../models/Media');

// Get all shows
exports.getShows = async (req, res) => {
    try {
        const shows = await Media.find({ type: 'show' }).populate('category').sort('-createdAt');
        res.status(200).json(shows);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a show
exports.createShow = async (req, res) => {
    try {
        const showData = { ...req.body, type: 'show' };
        const show = await Media.create(showData);
        res.status(201).json(show);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a show
exports.updateShow = async (req, res) => {
    try {
        const show = await Media.findOneAndUpdate(
            { _id: req.params.id, type: 'show' },
            req.body,
            { returnDocument: 'after' }
        );
        if (!show) return res.status(404).json({ error: 'Show not found' });
        res.status(200).json(show);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a show
exports.deleteShow = async (req, res) => {
    try {
        const show = await Media.findOneAndDelete({ _id: req.params.id, type: 'show' });
        if (!show) return res.status(404).json({ error: 'Show not found' });
        res.status(200).json({ message: 'Show deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
