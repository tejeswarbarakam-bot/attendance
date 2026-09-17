const mongoose = require('mongoose');

const sectionSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      uppercase: true // e.g. "Section A", "Section B" or "A", "B"
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model('Section', sectionSchema);
