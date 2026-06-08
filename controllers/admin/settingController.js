const Setting = require('../../models/Setting');

// @desc    Get settings
// @route   GET /api/admin/settings
// @access  Private/Admin
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            // Create default settings if none exist
            settings = await Setting.create({
                privacyPolicy: '',
                termsConditions: ''
            });
        }
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Get Settings Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching settings' });
    }
};

// @desc    Update settings
// @route   PUT /api/admin/settings
// @access  Private/Admin
exports.updateSettings = async (req, res) => {
    try {
        const { privacyPolicy, termsConditions } = req.body;
        
        let settings = await Setting.findOne();
        if (!settings) {
            settings = new Setting();
        }

        if (privacyPolicy !== undefined) settings.privacyPolicy = privacyPolicy;
        if (termsConditions !== undefined) settings.termsConditions = termsConditions;
        settings.updatedAt = Date.now();

        await settings.save();
        res.status(200).json({ success: true, data: settings });
    } catch (error) {
        console.error('Update Settings Error:', error);
        res.status(500).json({ success: false, message: 'Server Error updating settings' });
    }
};
