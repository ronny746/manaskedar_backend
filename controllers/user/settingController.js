const Setting = require('../../models/Setting');

// @desc    Get public settings (Privacy Policy, Terms & Conditions)
// @route   GET /api/user/settings
// @access  Private/User (protected by the parent route grouping)
exports.getSettings = async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            settings = {
                privacyPolicy: 'Pending configuration.',
                termsConditions: 'Pending configuration.'
            };
        }
        res.status(200).json({ 
            success: true, 
            data: {
                privacyPolicy: settings.privacyPolicy,
                termsConditions: settings.termsConditions
            } 
        });
    } catch (error) {
        console.error('User Get Settings Error:', error);
        res.status(500).json({ success: false, message: 'Server Error fetching application content' });
    }
};
