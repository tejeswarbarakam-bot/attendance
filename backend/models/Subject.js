const mongoose = require('mongoose');

const subjectSchema = new mongoose.Schema(
  {
    subjectCode: {
      type: String,
      required: true,
      unique: true,
      uppercase: true,
      trim: true
    },
    subjectName: {
      type: String,
      required: true,
      trim: true
    },
    department: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Department',
      required: true
    },
    semester: {
      type: String,
      required: true
    },
    credits: {
      type: Number,
      default: 3
    },
    subjectType: {
      type: String,
      enum: ['Theory', 'Laboratory', 'Elective'],
      default: 'Theory'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Subject', subjectSchema);
