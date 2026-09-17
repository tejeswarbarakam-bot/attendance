const mongoose = require('mongoose');

const settingsSchema = new mongoose.Schema(
  {
    minAttendancePercentage: {
      type: Number,
      default: 75,
      required: true
    },
    allowFacultyEdit: {
      type: Boolean,
      default: true
    },
    currentAcademicYear: {
      type: String,
      default: '2026-27'
    },
    currentSemester: {
      type: String,
      default: 'Semester 1'
    },
    collegeName: {
      type: String,
      default: 'Apex Institute of Technology & Science'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Settings', settingsSchema);
