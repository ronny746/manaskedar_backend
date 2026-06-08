const express = require('express');
const router = express.Router();
const movieCtrl = require('../../controllers/admin/movieController');

router.get('/', movieCtrl.getMovies);
router.post('/', movieCtrl.createMovie);
router.put('/:id', movieCtrl.updateMovie);
router.delete('/:id', movieCtrl.deleteMovie);

module.exports = router;
