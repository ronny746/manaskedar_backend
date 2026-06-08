const express = require('express');
const router = express.Router();
const movieController = require('../../controllers/user/movieController');
const { optionalProtect } = require('../../middleware/auth');

router.get('/', optionalProtect, movieController.getMovies);
router.get('/:id', optionalProtect, movieController.getMovieById);

module.exports = router;
