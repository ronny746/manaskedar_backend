const Asset = require('../../models/Asset');

exports.createAsset = async (req, res) => {
    try {
        const { name, url, type, fileSize, duration } = req.body;
        const asset = new Asset({ name, url, type, fileSize, duration });
        await asset.save();
        res.status(201).json(asset);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getAssets = async (req, res) => {
    try {
        const { type } = req.query;
        const filter = type ? { type } : {};
        const assets = await Asset.find(filter).sort({ createdAt: -1 });
        res.status(200).json(assets);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteAsset = async (req, res) => {
    try {
        await Asset.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Asset deleted' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
