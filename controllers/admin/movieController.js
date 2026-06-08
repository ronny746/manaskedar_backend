const Media = require('../../models/Media');

// Get all movies
exports.getMovies = async (req, res) => {
    try {
        const movies = await Media.find({ type: 'movie' }).populate('category').sort('-createdAt');
        res.status(200).json(movies);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Create a movie
exports.createMovie = async (req, res) => {
    try {
        const movieData = { ...req.body, type: 'movie' };
        const movie = await Media.create(movieData);
        res.status(201).json(movie);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Update a movie
exports.updateMovie = async (req, res) => {
    try {
        const movie = await Media.findOneAndUpdate(
            { _id: req.params.id, type: 'movie' },
            req.body,
            { returnDocument: 'after' }
        );
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        res.status(200).json(movie);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

// Delete a movie
exports.deleteMovie = async (req, res) => {
    try {
        const movie = await Media.findOneAndDelete({ _id: req.params.id, type: 'movie' });
        if (!movie) return res.status(404).json({ error: 'Movie not found' });
        res.status(200).json({ message: 'Movie deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
