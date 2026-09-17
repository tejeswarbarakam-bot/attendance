const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Student',
      required: true
    },
    faculty: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Faculty',
      required: true
    },
    subject: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Subject',
      required: true
    },
    class: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Class',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    date: {
      type: String, // Stored as ISO YYYY-MM-DD for precise day index matching
      required: true
    },
    period: {
      type: String, // e.g., "Period 1", "Period 2", "1", "2"
      required: true
    },
    status: {
      type: String,
      enum: ['Present', 'Absent'],
      required: true
    },
    academicYear: {
      type: String,
      required: true
    },
    semester: {
      type: String,
      required: true
    }
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate attendance records for the same student, subject, date, and period
attendanceSchema.index(
  { student: 1, subject: 1, date: 1, period: 1 },
  { unique: true }
);

module.exports = mongoose.model('Attendance', attendanceSchema);
