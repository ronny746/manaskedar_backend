const Media = require('../../models/Media');

// Get all shorts
exports.getShorts = async (req, res) => {
    try {
        const shorts = await Media.find({ type: { $in: ['short', 'shorts'] } }).populate('category').sort('-createdAt');
        res.status(200).json(shorts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a short
exports.createShort = async (req, res) => {
    try {
        const shortData = { ...req.body, type: 'shorts' };
        const short = await Media.create(shortData);
        res.status(201).json(short);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a short
exports.updateShort = async (req, res) => {
    try {
        const short = await Media.findOneAndUpdate(
            { _id: req.params.id, type: { $in: ['short', 'shorts'] } },
            req.body,
            { returnDocument: 'after' }
        );
        if (!short) return res.status(404).json({ error: 'Short not found' });
        res.status(200).json(short);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a short
exports.deleteShort = async (req, res) => {
    try {
        const short = await Media.findOneAndDelete({ _id: req.params.id, type: { $in: ['short', 'shorts'] } });
        if (!short) return res.status(404).json({ error: 'Short not found' });
        res.status(200).json({ message: 'Short deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
