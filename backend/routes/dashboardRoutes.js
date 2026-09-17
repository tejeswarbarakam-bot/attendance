const express = require('express');
const router = express.Router();
const {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard
} = require('../controllers/dashboardController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.get('/admin', protect, authorize('admin'), getAdminDashboard);
router.get('/faculty', protect, authorize('faculty'), getFacultyDashboard);
router.get('/student', protect, authorize('student'), getStudentDashboard);

module.exports = router;
