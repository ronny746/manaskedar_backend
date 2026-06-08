const User = require('../../models/User');

exports.getAllUsers = async (req, res) => {
    try {
        const users = await User.find()
            .select('-otp -otpExpiry')
            .sort('-createdAt');
        res.status(200).json(users);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.getUserDetails = async (req, res) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('watchHistory.media')
            .select('-otp -otpExpiry');
        if (!user) return res.status(404).json({ error: 'User not found' });
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { name, email, phone, city } = req.body;
        const user = await User.findByIdAndUpdate(
            req.params.id, 
            { name, email, phone, city }, 
            { returnDocument: 'after' }
        );
        res.status(200).json(user);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.deleteUser = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });
        
        if (user.isAdmin) {
            return res.status(400).json({ error: 'Cannot delete an admin user' });
        }

        await User.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: 'User deleted successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.toggleAdmin = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.isAdmin = !user.isAdmin;
        await user.save();
        
        res.status(200).json({ message: `Role updated`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.togglePremium = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) return res.status(404).json({ error: 'User not found' });

        user.isPremium = !user.isPremium;
        await user.save();
        
        res.status(200).json({ message: `Premium status updated`, user });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

exports.updateAdminPassword = async (req, res) => {
    try {
        const { currentPassword, newPassword } = req.body;
        const user = await User.findById(req.user.id).select('+password');
        
        const isMatch = await user.matchPassword(currentPassword);
        if (!isMatch) {
            return res.status(400).json({ error: 'Current password is incorrect' });
        }

        user.password = newPassword;
        await user.save();

        res.status(200).json({ message: 'Password updated successfully' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};
