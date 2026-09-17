const AuditLog = require('../models/AuditLog');

const logAudit = async ({ req, action, module, details, oldValue = null, newValue = null }) => {
  try {
    if (!req || !req.user) return;
    
    await AuditLog.create({
      user: req.user._id,
      username: req.user.username,
      action,
      module,
      details,
      oldValue,
      newValue,
      ipAddress: req.ip || req.connection.remoteAddress
    });
  } catch (error) {
    console.error('Audit Log Error:', error.message);
  }
};

module.exports = { logAudit };
