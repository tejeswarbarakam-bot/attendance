const Notification = require('../models/Notification');

// @desc    Get user notifications
// @route   GET /api/notifications
// @access  Private
const getNotifications = async (req, res) => {
  try {
    const userRole = req.user.role;
    const userId = req.user._id;

    const notifications = await Notification.find({
      $or: [
        { recipient: userId },
        { targetRole: userRole },
        { targetRole: 'all' }
      ]
    }).sort({ createdAt: -1 }).limit(20);

    res.json({ success: true, count: notifications.length, data: notifications });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Mark notification as read
// @route   PUT /api/notifications/:id/read
// @access  Private
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { isRead: true },
      { new: true }
    );
    res.json({ success: true, data: notification });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create broadcast notification (Admin)
// @route   POST /api/notifications
// @access  Private (Admin)
const createNotification = async (req, res) => {
  try {
    const { recipient, targetRole, title, message, type } = req.body;
    const notification = await Notification.create({
      recipient,
      targetRole: targetRole || 'all',
      title,
      message,
      type: type || 'info'
    });
    res.status(201).json({ success: true, data: notification });
  } catch (error) {
    res.status(400).json({ success: false, message: error.message });
  }
};

module.exports = { getNotifications, markAsRead, createNotification };
