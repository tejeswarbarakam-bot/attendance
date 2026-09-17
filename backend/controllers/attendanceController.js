const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Settings = require('../models/Settings');
const Notification = require('../models/Notification');
const { calculatePercentage, calculateRequiredClasses } = require('../utils/helpers');
const { logAudit } = require('../utils/auditLogger');

// @desc    Mark bulk attendance for a class
// @route   POST /api/attendance/mark
// @access  Private (Faculty & Admin)
const markAttendance = async (req, res) => {
  try {
    const { facultyId, subjectId, classId, departmentId, date, period, records, academicYear, semester } = req.body;

    if (!subjectId || !classId || !departmentId || !date || !period || !records || !Array.isArray(records)) {
      return res.status(400).json({ success: false, message: 'Missing required attendance fields or records list' });
    }

    let actualFacultyId = facultyId;
    if (req.user.role === 'faculty') {
      const facultyObj = await Faculty.findOne({ user: req.user._id });
      if (facultyObj) actualFacultyId = facultyObj._id;
    }

    const createdRecords = [];
    const updatedRecords = [];
    const duplicateErrors = [];

    for (const item of records) {
      const { studentId, status } = item;

      // Check existing
      const existing = await Attendance.findOne({
        student: studentId,
        subject: subjectId,
        date,
        period
      });

      if (existing) {
        // If already exists, update if status changed
        if (existing.status !== status) {
          const oldStatus = existing.status;
          existing.status = status;
          await existing.save();
          updatedRecords.push(existing);

          await logAudit({
            req,
            action: 'UPDATE_ATTENDANCE',
            module: 'Attendance',
            details: `Updated attendance for student ${studentId} on ${date} ${period}: ${oldStatus} -> ${status}`,
            oldValue: { status: oldStatus },
            newValue: { status }
          });
        } else {
          duplicateErrors.push(studentId);
        }
      } else {
        const newRecord = await Attendance.create({
          student: studentId,
          faculty: actualFacultyId,
          subject: subjectId,
          class: classId,
          department: departmentId,
          date,
          period,
          status,
          academicYear: academicYear || '2026-27',
          semester: semester || 'Semester 1'
        });
        createdRecords.push(newRecord);
      }
    }

    // Trigger shortage check notifications for students with low attendance
    triggerShortageNotifications(records.map(r => r.studentId));

    await logAudit({
      req,
      action: 'MARK_ATTENDANCE',
      module: 'Attendance',
      details: `Marked attendance for ${records.length} students on ${date} (${period})`
    });

    res.json({
      success: true,
      message: `Attendance processed. New: ${createdRecords.length}, Updated: ${updatedRecords.length}, Skipped identical duplicates: ${duplicateErrors.length}`,
      createdCount: createdRecords.length,
      updatedCount: updatedRecords.length
    });
  } catch (error) {
    console.error('Mark Attendance Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Helper: Check & trigger shortage notifications in background
const triggerShortageNotifications = async (studentIds) => {
  try {
    const settings = await Settings.findOne() || { minAttendancePercentage: 75 };
    const minPercent = settings.minAttendancePercentage;

    for (const id of studentIds) {
      const records = await Attendance.find({ student: id });
      if (records.length === 0) continue;
      const total = records.length;
      const present = records.filter(r => r.status === 'Present').length;
      const percent = calculatePercentage(present, total);

      if (percent < minPercent) {
        const studentObj = await Student.findById(id);
        if (studentObj && studentObj.user) {
          // Check if warning already created today
          const todayStr = new Date().toISOString().split('T')[0];
          const existingNotif = await Notification.findOne({
            recipient: studentObj.user,
            type: 'warning',
            createdAt: { $gte: new Date(todayStr) }
          });

          if (!existingNotif) {
            await Notification.create({
              recipient: studentObj.user,
              targetRole: 'student',
              title: 'Attendance Shortage Warning',
              message: `Your overall attendance is currently ${percent}%, which is below the required ${minPercent}%. Please attend upcoming classes.`,
              type: 'warning'
            });
          }
        }
      }
    }
  } catch (err) {
    console.error('Notification Trigger Error:', err.message);
  }
};

// @desc    Get attendance history with filtering
// @route   GET /api/attendance/history
// @access  Private
const getAttendanceHistory = async (req, res) => {
  try {
    const { student, faculty, subject, classId, date, startDate, endDate, status } = req.query;
    const filter = {};

    // Role-based restrictions
    if (req.user.role === 'student') {
      const studentObj = await Student.findOne({ user: req.user._id });
      if (!studentObj) return res.status(404).json({ success: false, message: 'Student profile not found' });
      filter.student = studentObj._id;
    } else if (student) {
      filter.student = student;
    }

    if (req.user.role === 'faculty') {
      const facultyObj = await Faculty.findOne({ user: req.user._id });
      if (facultyObj) filter.faculty = facultyObj._id;
    } else if (faculty) {
      filter.faculty = faculty;
    }

    if (subject) filter.subject = subject;
    if (classId) filter.class = classId;
    if (status) filter.status = status;

    if (date) {
      filter.date = date;
    } else if (startDate && endDate) {
      filter.date = { $gte: startDate, $lte: endDate };
    }

    const history = await Attendance.find(filter)
      .populate('student', 'name rollNumber studentId')
      .populate('faculty', 'name facultyId')
      .populate('subject', 'subjectCode subjectName credits')
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'name code' },
          { path: 'section', select: 'name' }
        ]
      })
      .sort({ date: -1, createdAt: -1 });

    res.json({ success: true, count: history.length, data: history });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get attendance stats & subject breakdown for a student
// @route   GET /api/attendance/student/:id
// @access  Private
const getStudentAttendance = async (req, res) => {
  try {
    let studentId = req.params.id;

    if (studentId === 'me' || req.user.role === 'student') {
      const studentObj = await Student.findOne({ user: req.user._id });
      if (!studentObj) return res.status(404).json({ success: false, message: 'Student profile not found' });
      studentId = studentObj._id;
    }

    const studentObj = await Student.findById(studentId)
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('section', 'name');

    if (!studentObj) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const settings = (await Settings.findOne()) || { minAttendancePercentage: 75 };
    const minPercent = settings.minAttendancePercentage;

    const allRecords = await Attendance.find({ student: studentId })
      .populate('subject', 'subjectCode subjectName credits subjectType')
      .populate('faculty', 'name')
      .sort({ date: -1 });

    const totalClasses = allRecords.length;
    const presentCount = allRecords.filter(r => r.status === 'Present').length;
    const absentCount = totalClasses - presentCount;
    const overallPercentage = calculatePercentage(presentCount, totalClasses);
    const requiredClasses = calculateRequiredClasses(presentCount, totalClasses, minPercent);
    const isShortage = overallPercentage < minPercent;

    // Subject-wise breakdown map
    const subjectMap = {};

    allRecords.forEach(rec => {
      if (!rec.subject) return;
      const subId = rec.subject._id.toString();
      if (!subjectMap[subId]) {
        subjectMap[subId] = {
          subjectId: subId,
          subjectCode: rec.subject.subjectCode,
          subjectName: rec.subject.subjectName,
          subjectType: rec.subject.subjectType,
          total: 0,
          present: 0,
          absent: 0,
          percentage: 0,
          status: 'Good'
        };
      }

      subjectMap[subId].total += 1;
      if (rec.status === 'Present') {
        subjectMap[subId].present += 1;
      } else {
        subjectMap[subId].absent += 1;
      }
    });

    const subjectBreakdown = Object.values(subjectMap).map(sub => {
      const pct = calculatePercentage(sub.present, sub.total);
      sub.percentage = pct;
      if (pct < minPercent) {
        sub.status = 'Shortage';
      } else if (pct < minPercent + 5) {
        sub.status = 'Warning';
      } else {
        sub.status = 'Good';
      }
      return sub;
    });

    res.json({
      success: true,
      data: {
        student: studentObj,
        summary: {
          totalClasses,
          presentCount,
          absentCount,
          overallPercentage,
          minPercentRequired: minPercent,
          isShortage,
          requiredClassesToReachMin: requiredClasses
        },
        subjectBreakdown,
        recentRecords: allRecords.slice(0, 10)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update single attendance record
// @route   PUT /api/attendance/:id
// @access  Private (Faculty & Admin)
const updateAttendanceRecord = async (req, res) => {
  try {
    const { status } = req.body;
    const record = await Attendance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({ success: false, message: 'Attendance record not found' });
    }

    const settings = (await Settings.findOne()) || { allowFacultyEdit: true };
    if (req.user.role === 'faculty' && !settings.allowFacultyEdit) {
      return res.status(403).json({ success: false, message: 'Faculty editing of attendance is currently disabled by Admin' });
    }

    const oldStatus = record.status;
    record.status = status;
    await record.save();

    await logAudit({
      req,
      action: 'EDIT_ATTENDANCE',
      module: 'Attendance',
      details: `Changed attendance record ${record._id}: ${oldStatus} -> ${status}`,
      oldValue: { status: oldStatus },
      newValue: { status }
    });

    res.json({ success: true, data: record });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  markAttendance,
  getAttendanceHistory,
  getStudentAttendance,
  updateAttendanceRecord
};
