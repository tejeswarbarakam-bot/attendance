const mongoose = require('mongoose');

const assignmentSchema = new mongoose.Schema(
  {
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

// Ensure unique assignment for a faculty-subject-class combination
assignmentSchema.index(
  { faculty: 1, subject: 1, class: 1, academicYear: 1 },
  { unique: true }
);

module.exports = mongoose.model('Assignment', assignmentSchema);
