const mongoose = require('mongoose');

const classSchema = new mongoose.Schema(
  {
    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Course',
      required: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    year: {
      type: String,
      required: true // e.g., "1st Year", "2nd Year", "3rd Year", "4th Year"
    },
    semester: {
      type: String,
      required: true // e.g., "Semester 1", "Semester 5"
    },
    section: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Section',
      required: true
    },
    academicYear: {
      type: String,
      required: true // e.g. "2026-27"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Class', classSchema);
