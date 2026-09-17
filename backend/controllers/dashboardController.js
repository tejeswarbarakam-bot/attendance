const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Subject = require('../models/Subject');
const Attendance = require('../models/Attendance');
const Assignment = require('../models/Assignment');
const Settings = require('../models/Settings');
const { calculatePercentage } = require('../utils/helpers');

// @desc    Get Admin Dashboard Statistics & Analytics
// @route   GET /api/dashboard/admin
// @access  Private (Admin)
const getAdminDashboard = async (req, res) => {
  try {
    const totalStudents = await Student.countDocuments({ isActive: true });
    const totalFaculty = await Faculty.countDocuments({ isActive: true });
    const totalDepartments = await Department.countDocuments();
    const totalSubjects = await Subject.countDocuments();

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = await Attendance.find({ date: todayStr });
    const todayTotal = todayRecords.length;
    const todayPresent = todayRecords.filter(r => r.status === 'Present').length;
    const todayPercentage = calculatePercentage(todayPresent, todayTotal);

    // Compute Department-wise attendance breakdown
    const departments = await Department.find();
    const departmentStats = [];

    for (const dept of departments) {
      const records = await Attendance.find({ department: dept._id });
      const total = records.length;
      const present = records.filter(r => r.status === 'Present').length;
      const pct = calculatePercentage(present, total);
      departmentStats.push({
        name: dept.name,
        code: dept.code,
        totalClasses: total,
        presentClasses: present,
        percentage: pct
      });
    }

    // Compute Low Attendance (Shortage) Students Count
    const settings = (await Settings.findOne()) || { minAttendancePercentage: 75 };
    const minPercent = settings.minAttendancePercentage;

    const allStudents = await Student.find({ isActive: true }).select('_id name rollNumber department');
    let lowAttendanceCount = 0;
    const shortageStudents = [];

    for (const st of allStudents) {
      const stRecords = await Attendance.find({ student: st._id });
      if (stRecords.length > 0) {
        const pr = stRecords.filter(r => r.status === 'Present').length;
        const pct = calculatePercentage(pr, stRecords.length);
        if (pct < minPercent) {
          lowAttendanceCount++;
          shortageStudents.push({
            studentId: st._id,
            name: st.name,
            rollNumber: st.rollNumber,
            percentage: pct,
            total: stRecords.length,
            present: pr
          });
        }
      }
    }

    // Overall attendance calculation
    const allAttendance = await Attendance.find();
    const overallTotal = allAttendance.length;
    const overallPresent = allAttendance.filter(r => r.status === 'Present').length;
    const overallPercentage = calculatePercentage(overallPresent, overallTotal);

    res.json({
      success: true,
      data: {
        totalStudents,
        totalFaculty,
        totalDepartments,
        totalSubjects,
        todayAttendance: {
          total: todayTotal,
          present: todayPresent,
          percentage: todayPercentage
        },
        overallAttendance: {
          total: overallTotal,
          present: overallPresent,
          absent: overallTotal - overallPresent,
          percentage: overallPercentage
        },
        lowAttendanceCount,
        shortageStudents: shortageStudents.slice(0, 10),
        departmentStats
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Faculty Dashboard Statistics
// @route   GET /api/dashboard/faculty
// @access  Private (Faculty)
const getFacultyDashboard = async (req, res) => {
  try {
    const faculty = await Faculty.findOne({ user: req.user._id });
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty profile not found' });
    }

    const assignments = await Assignment.find({ faculty: faculty._id })
      .populate('subject', 'subjectCode subjectName')
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'name code' },
          { path: 'section', select: 'name' }
        ]
      });

    const assignedClassesCount = assignments.length;
    const uniqueSubjects = [...new Set(assignments.map(a => a.subject?._id.toString()))].length;

    const todayStr = new Date().toISOString().split('T')[0];
    const todayRecords = await Attendance.find({ faculty: faculty._id, date: todayStr });
    const todayClassesMarked = [...new Set(todayRecords.map(r => `${r.subject}_${r.period}`))].length;

    const totalAttendanceSubmitted = await Attendance.countDocuments({ faculty: faculty._id });

    res.json({
      success: true,
      data: {
        faculty,
        assignedClassesCount,
        assignedSubjectsCount: uniqueSubjects,
        todayClassesMarked,
        totalAttendanceSubmitted,
        assignments
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get Student Dashboard Statistics
// @route   GET /api/dashboard/student
// @access  Private (Student)
const getStudentDashboard = async (req, res) => {
  try {
    const student = await Student.findOne({ user: req.user._id })
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('section', 'name');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student profile not found' });
    }

    const records = await Attendance.find({ student: student._id })
      .populate('subject', 'subjectCode subjectName')
      .populate('faculty', 'name')
      .sort({ date: -1 });

    const totalClasses = records.length;
    const presentCount = records.filter(r => r.status === 'Present').length;
    const absentCount = totalClasses - presentCount;
    const percentage = calculatePercentage(presentCount, totalClasses);

    const settings = (await Settings.findOne()) || { minAttendancePercentage: 75 };

    res.json({
      success: true,
      data: {
        student,
        stats: {
          totalClasses,
          presentCount,
          absentCount,
          percentage,
          minRequired: settings.minAttendancePercentage,
          isShortage: percentage < settings.minAttendancePercentage
        },
        recentHistory: records.slice(0, 5)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAdminDashboard,
  getFacultyDashboard,
  getStudentDashboard
};
