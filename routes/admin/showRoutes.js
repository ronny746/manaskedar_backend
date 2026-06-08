const express = require('express');
const router = express.Router();
const showCtrl = require('../../controllers/admin/showController');

router.get('/', showCtrl.getShows);
router.post('/', showCtrl.createShow);
router.put('/:id', showCtrl.updateShow);
router.delete('/:id', showCtrl.deleteShow);

module.exports = router;
