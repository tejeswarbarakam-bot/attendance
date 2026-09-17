const express = require('express');
const router = express.Router();
const {
  markAttendance,
  getAttendanceHistory,
  getStudentAttendance,
  updateAttendanceRecord
} = require('../controllers/attendanceController');
const { protect, authorize } = require('../middleware/authMiddleware');

router.post('/mark', protect, authorize('faculty', 'admin'), markAttendance);
router.get('/history', protect, getAttendanceHistory);
router.get('/student/:id', protect, getStudentAttendance);
router.put('/:id', protect, authorize('faculty', 'admin'), updateAttendanceRecord);

module.exports = router;
