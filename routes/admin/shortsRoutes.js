const express = require('express');
const router = express.Router();
const shortsCtrl = require('../../controllers/admin/shortsController');

router.get('/', shortsCtrl.getShorts);
router.post('/', shortsCtrl.createShort);
router.put('/:id', shortsCtrl.updateShort);
router.delete('/:id', shortsCtrl.deleteShort);

module.exports = router;
