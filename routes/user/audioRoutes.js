const express = require('express');
const router = express.Router();
const audioCtrl = require('../../controllers/user/audioController');

router.get('/', audioCtrl.getAudios);
router.get('/:id', audioCtrl.getAudioById);

module.exports = router;
