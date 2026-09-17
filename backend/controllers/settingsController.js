const Settings = require('../models/Settings');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get system settings
// @route   GET /api/settings
// @access  Public / Private
const getSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    if (!settings) {
      settings = await Settings.create({});
    }
    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update system settings
// @route   PUT /api/settings
// @access  Private (Admin)
const updateSettings = async (req, res) => {
  try {
    let settings = await Settings.findOne();
    const oldVal = settings ? settings.toObject() : null;

    if (!settings) {
      settings = await Settings.create(req.body);
    } else {
      settings = await Settings.findByIdAndUpdate(settings._id, req.body, {
        new: true,
        runValidators: true
      });
    }

    await logAudit({
      req,
      action: 'UPDATE_SETTINGS',
      module: 'System Settings',
      details: `Updated minimum attendance threshold or system configuration`,
      oldValue: oldVal,
      newValue: settings
    });

    res.json({ success: true, data: settings });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getSettings, updateSettings };
