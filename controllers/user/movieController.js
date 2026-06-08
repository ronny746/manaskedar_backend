const Media = require('../../models/Media');
const { enrichMediaWithUserData, enrichSingleMediaWithUserData } = require('../../utils/mediaHelper');

// Get all movies (supports search)
exports.getMovies = async (req, res) => {
    try {
        const { search } = req.query;
        let filter = { type: 'movie' };
        if (search) {
            filter.title = { $regex: search, $options: 'i' };
        }
        const movies = await Media.find(filter).sort('-createdAt');
        const enriched = await enrichMediaWithUserData(movies, req.user?.id);
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Get a single movie by ID
exports.getMovieById = async (req, res) => {
    try {
        const movie = await Media.findOne({ _id: req.params.id, type: 'movie' });
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        const enriched = await enrichSingleMediaWithUserData(movie, req.user?.id);
        res.status(200).json(enriched);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
