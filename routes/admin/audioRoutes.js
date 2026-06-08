const express = require('express');
const router = express.Router();
const audioCtrl = require('../../controllers/admin/audioController');

router.get('/', audioCtrl.getAudios);
router.post('/', audioCtrl.createAudio);
router.put('/:id', audioCtrl.updateAudio);
router.delete('/:id', audioCtrl.deleteAudio);

module.exports = router;
