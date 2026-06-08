const express = require('express');
const router = express.Router();
const shortsCtrl = require('../../controllers/user/shortsController');

router.get('/', shortsCtrl.getShorts);
router.get('/:id', shortsCtrl.getShortById);

module.exports = router;
