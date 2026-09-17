const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    username: {
      type: String
    },
    action: {
      type: String,
      required: true // e.g. "MARK_ATTENDANCE", "UPDATE_ATTENDANCE", "ADD_STUDENT", "DELETE_STUDENT"
    },
    module: {
      type: String,
      required: true // e.g. "Attendance", "Students", "Faculty", "Settings"
    },
    details: {
      type: String
    },
    oldValue: {
      type: mongoose.Schema.Types.Mixed
    },
    newValue: {
      type: mongoose.Schema.Types.Mixed
    },
    ipAddress: {
      type: String
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
