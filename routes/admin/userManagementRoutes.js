const express = require('express');
const router = express.Router();
const User = require('../../models/User');
const { protect, admin } = require('../../middleware/auth');

router.use(protect, admin);

// List all administrative and consumer identities
router.get('/', async (req, res) => {
    try {
        const users = await User.find().sort('-createdAt');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Rescind administrative access or deactivate account
router.delete('/:id', async (req, res) => {
    try {
        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'Identity rescinded' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
