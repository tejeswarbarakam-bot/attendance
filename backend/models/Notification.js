const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: false // Null if targeted to all users of a specific role
    },
    targetRole: {
      type: String,
      enum: ['student', 'faculty', 'admin', 'all'],
      default: 'all'
    },
    title: {
      type: String,
      required: true
    },
    message: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['warning', 'info', 'alert', 'success'],
      default: 'info'
    },
    isRead: {
      type: Boolean,
      default: false
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Notification', notificationSchema);
