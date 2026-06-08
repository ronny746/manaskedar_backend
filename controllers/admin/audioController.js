const Media = require('../../models/Media');

// Get all audio
exports.getAudios = async (req, res) => {
    try {
        const audios = await Media.find({ type: 'audio' }).populate('category').sort('-createdAt');
        res.status(200).json(audios);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create an audio
exports.createAudio = async (req, res) => {
    try {
        const audioData = { ...req.body, type: 'audio' };
        const audio = await Media.create(audioData);
        res.status(201).json(audio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update an audio
exports.updateAudio = async (req, res) => {
    try {
        const audio = await Media.findOneAndUpdate(
            { _id: req.params.id, type: 'audio' },
            req.body,
            { returnDocument: 'after' }
        );
        if (!audio) return res.status(404).json({ error: 'Audio not found' });
        res.status(200).json(audio);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete an audio
exports.deleteAudio = async (req, res) => {
    try {
        const audio = await Media.findOneAndDelete({ _id: req.params.id, type: 'audio' });
        if (!audio) return res.status(404).json({ error: 'Audio not found' });
        res.status(200).json({ message: 'Audio deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
