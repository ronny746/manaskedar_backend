const express = require('express');
const router = express.Router();
const assetController = require('../../controllers/admin/assetController');
const { protect, admin } = require('../../middleware/auth');

router.post('/', protect, admin, assetController.createAsset);
router.get('/', protect, admin, assetController.getAssets);
router.delete('/:id', protect, admin, assetController.deleteAsset);

module.exports = router;
