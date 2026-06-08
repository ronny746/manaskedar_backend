const express = require('express');
const router = express.Router();
const userCtrl = require('../../controllers/user/userContentController');
const userSettingCtrl = require('../../controllers/user/settingController');
const { protect } = require('../../middleware/auth');

// Ensure all user routes require an authenticated user
router.use(protect);

// User content
router.get('/home', userCtrl.getHomeData);
router.get('/banners', userCtrl.getBanners);
router.get('/media', userCtrl.getMedia);
router.get('/settings', userSettingCtrl.getSettings);

// Specific Content Routes
router.use('/movies', require('./movieRoutes'));
router.use('/shorts', require('./shortsRoutes'));
router.use('/audios', require('./audioRoutes'));
router.use('/shows', require('./showRoutes'));
router.use('/activity', require('./activityRoutes'));

// Interactions
const interactionCtrl = require('../../controllers/user/interactionController');
router.post('/interactions/like/:mediaId', interactionCtrl.toggleLike);
router.post('/interactions/share/:mediaId', interactionCtrl.incrementShare);
router.post('/interactions/view/:mediaId', interactionCtrl.incrementView);

// Comment system
router.get('/interactions/comments/:mediaId', interactionCtrl.getComments);
router.post('/interactions/comment/:mediaId', interactionCtrl.postComment);
router.post('/interactions/comment/:commentId/like', interactionCtrl.toggleCommentLike);

// User Image Upload (dp)
const multer = require('multer');
const upload = multer({ 
    storage: multer.diskStorage({
        destination: (req, file, cb) => cb(null, 'uploads/'),
        filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '_'))
    }),
    limits: { fileSize: 10 * 1024 * 1024 } // 10 MB for Profile Pic
});
const adminCtrl = require('../../controllers/admin/adminContentController');
router.post('/upload', upload.single('file'), adminCtrl.uploadFile);

module.exports = router;
