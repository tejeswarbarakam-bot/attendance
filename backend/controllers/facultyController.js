const Faculty = require('../models/Faculty');
const User = require('../models/User');
const Assignment = require('../models/Assignment');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all faculty members
// @route   GET /api/faculty
// @access  Private (Admin & Faculty)
const getFaculty = async (req, res) => {
  try {
    const { department, search } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { facultyId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const faculty = await Faculty.find(filter)
      .populate('department', 'name code')
      .sort({ name: 1 });

    res.json({ success: true, count: faculty.length, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get faculty by ID
// @route   GET /api/faculty/:id
// @access  Private
const getFacultyById = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id).populate('department', 'name code');
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    // Get assigned subjects and classes for this faculty
    const assignments = await Assignment.find({ faculty: faculty._id })
      .populate('subject', 'subjectCode subjectName credits')
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'name code' },
          { path: 'department', select: 'name code' },
          { path: 'section', select: 'name' }
        ]
      });

    res.json({ success: true, data: { ...faculty.toObject(), assignments } });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create new Faculty & User credentials
// @route   POST /api/faculty
// @access  Private (Admin)
const createFaculty = async (req, res) => {
  try {
    const { facultyId, name, email, phone, department, designation, password } = req.body;

    const existing = await Faculty.findOne({
      $or: [{ facultyId }, { email: email.toLowerCase() }]
    });

    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'Faculty ID or Email already exists'
      });
    }

    // 1. Create User
    const newUser = await User.create({
      username: facultyId.toLowerCase(),
      email: email.toLowerCase(),
      password: password || 'Faculty@123',
      role: 'faculty',
      roleRef: 'Faculty'
    });

    // 2. Create Faculty Profile
    const faculty = await Faculty.create({
      facultyId,
      name,
      email: email.toLowerCase(),
      phone,
      department,
      designation,
      user: newUser._id
    });

    newUser.profileId = faculty._id;
    await newUser.save();

    await logAudit({
      req,
      action: 'ADD_FACULTY',
      module: 'Faculty Management',
      details: `Added faculty ${name} (${facultyId})`,
      newValue: { facultyId, name, email }
    });

    res.status(201).json({ success: true, data: faculty });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update Faculty member
// @route   PUT /api/faculty/:id
// @access  Private (Admin)
const updateFaculty = async (req, res) => {
  try {
    const oldFaculty = await Faculty.findById(req.params.id);
    if (!oldFaculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    const updated = await Faculty.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    }).populate('department', 'name code');

    if (req.body.email && oldFaculty.user) {
      await User.findByIdAndUpdate(oldFaculty.user, { email: req.body.email.toLowerCase() });
    }

    await logAudit({
      req,
      action: 'EDIT_FACULTY',
      module: 'Faculty Management',
      details: `Updated faculty ${updated.name} (${updated.facultyId})`,
      oldValue: oldFaculty,
      newValue: updated
    });

    res.json({ success: true, data: updated });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Deactivate/Delete Faculty
// @route   DELETE /api/faculty/:id
// @access  Private (Admin)
const deleteFaculty = async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) {
      return res.status(404).json({ success: false, message: 'Faculty not found' });
    }

    if (req.query.permanent === 'true') {
      if (faculty.user) {
        await User.findByIdAndDelete(faculty.user);
      }
      await Assignment.deleteMany({ faculty: faculty._id });
      await Faculty.findByIdAndDelete(req.params.id);
    } else {
      faculty.isActive = false;
      await faculty.save();
      if (faculty.user) {
        await User.findByIdAndUpdate(faculty.user, { isActive: false });
      }
    }

    await logAudit({
      req,
      action: 'DELETE_FACULTY',
      module: 'Faculty Management',
      details: `Deactivated/Deleted faculty ${faculty.name} (${faculty.facultyId})`
    });

    res.json({ success: true, message: 'Faculty deactivated/removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
};
