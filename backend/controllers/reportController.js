const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const Subject = require('../models/Subject');
const Class = require('../models/Class');
const Department = require('../models/Department');
const { calculatePercentage } = require('../utils/helpers');

// @desc    Generate Attendance Reports (Student, Subject, Class, Date)
// @route   GET /api/reports
// @access  Private (Faculty & Admin)
const generateReport = async (req, res) => {
  try {
    const { type, department, subject, classId, date, startDate, endDate } = req.query;

    if (type === 'student') {
      const filter = {};
      if (department) filter.department = department;
      if (classId) filter.class = classId;

      const students = await Student.find(filter)
        .populate('department', 'name code')
        .populate('course', 'name code')
        .populate('section', 'name')
        .sort({ rollNumber: 1 });

      const reportData = [];

      for (const st of students) {
        const records = await Attendance.find({ student: st._id });
        const total = records.length;
        const present = records.filter(r => r.status === 'Present').length;
        const absent = total - present;
        const pct = calculatePercentage(present, total);

        reportData.push({
          rollNumber: st.rollNumber,
          name: st.name,
          department: st.department?.code || '',
          totalClasses: total,
          present,
          absent,
          percentage: pct,
          status: pct < 75 ? 'Shortage' : pct < 80 ? 'Warning' : 'Good'
        });
      }

      return res.json({ success: true, type: 'student', data: reportData });
    }

    if (type === 'subject') {
      const filter = {};
      if (department) filter.department = department;
      if (subject) filter._id = subject;

      const subjects = await Subject.find(filter).populate('department', 'name code');
      const reportData = [];

      for (const sub of subjects) {
        const records = await Attendance.find({ subject: sub._id });
        const total = records.length;
        const present = records.filter(r => r.status === 'Present').length;
        const absent = total - present;
        const pct = calculatePercentage(present, total);

        reportData.push({
          subjectCode: sub.subjectCode,
          subjectName: sub.subjectName,
          department: sub.department?.code || '',
          totalClasses: total,
          present,
          absent,
          percentage: pct
        });
      }

      return res.json({ success: true, type: 'subject', data: reportData });
    }

    if (type === 'date') {
      const targetDate = date || new Date().toISOString().split('T')[0];
      const records = await Attendance.find({ date: targetDate })
        .populate('student', 'name rollNumber')
        .populate('faculty', 'name')
        .populate('subject', 'subjectCode subjectName')
        .populate('department', 'name code');

      return res.json({ success: true, type: 'date', date: targetDate, data: records });
    }

    // Default fallback
    const allRecords = await Attendance.find()
      .limit(100)
      .populate('student', 'name rollNumber')
      .populate('subject', 'subjectCode subjectName');

    res.json({ success: true, type: 'general', data: allRecords });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = { generateReport };
