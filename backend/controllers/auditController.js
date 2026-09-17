const AuditLog = require('../models/AuditLog');

// @desc    Get system audit logs
// @route   GET /api/audit-logs
// @access  Private (Admin)
const getAuditLogs = async (req, res) => {
  try {
    const { module, action, search } = req.query;
    const filter = {};

    if (module) filter.module = module;
    if (action) filter.action = action;
    if (search) {
      filter.$or = [
        { details: { $regex: search, $options: 'i' } },
        { username: { $regex: search, $options: 'i' } }
      ];
    }

    const logs = await AuditLog.find(filter)
      .populate('user', 'username email role')
      .sort({ createdAt: -1 })
      .limit(100);

    res.json({ success: true, count: logs.length, data: logs });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { getAuditLogs };
