const express = require('express');
const router = express.Router();
const activityController = require('../../controllers/user/activityController');
const { protect } = require('../../middleware/auth');

router.use(protect); // All these routes need protection

// Favorites
router.post('/favorites/:mediaId', activityController.toggleFavorite);
router.get('/favorites', activityController.getFavorites);

// History
router.post('/history', activityController.updateWatchHistory);
router.get('/history', activityController.getWatchHistory);

module.exports = router;
