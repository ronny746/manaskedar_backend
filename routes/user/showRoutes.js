const express = require('express');
const router = express.Router();
const showCtrl = require('../../controllers/user/showController');

router.get('/', showCtrl.getShows);
router.get('/:id', showCtrl.getShowById);

module.exports = router;
