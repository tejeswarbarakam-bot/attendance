const Student = require('../models/Student');
const User = require('../models/User');
const Attendance = require('../models/Attendance');
const { logAudit } = require('../utils/auditLogger');

// @desc    Get all students (with search & filtering)
// @route   GET /api/students
// @access  Private (Admin & Faculty)
const getStudents = async (req, res) => {
  try {
    const { department, course, year, semester, section, search } = req.query;
    const filter = {};

    if (department) filter.department = department;
    if (course) filter.course = course;
    if (year) filter.year = year;
    if (semester) filter.semester = semester;
    if (section) filter.section = section;

    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { rollNumber: { $regex: search, $options: 'i' } },
        { studentId: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const students = await Student.find(filter)
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('section', 'name')
      .sort({ rollNumber: 1 });

    res.json({ success: true, count: students.length, data: students });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single student by ID
// @route   GET /api/students/:id
// @access  Private
const getStudentById = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id)
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('section', 'name');

    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    res.json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add new student & create User credentials
// @route   POST /api/students
// @access  Private (Admin)
const createStudent = async (req, res) => {
  try {
    const {
      studentId,
      rollNumber,
      name,
      email,
      phone,
      department,
      course,
      year,
      semester,
      section,
      academicYear,
      password
    } = req.body;

    // Check duplicate studentId / rollNumber / email
    const existingStudent = await Student.findOne({
      $or: [{ studentId }, { rollNumber }, { email: email.toLowerCase() }]
    });

    if (existingStudent) {
      return res.status(400).json({
        success: false,
        message: 'Student ID, Roll Number, or Email already exists'
      });
    }

    // 1. Create User account
    const newUser = await User.create({
      username: rollNumber.toLowerCase(),
      email: email.toLowerCase(),
      password: password || 'Student@123',
      role: 'student',
      roleRef: 'Student'
    });

    // 2. Create Student profile
    const student = await Student.create({
      studentId,
      rollNumber,
      name,
      email: email.toLowerCase(),
      phone,
      department,
      course,
      year,
      semester,
      section,
      academicYear,
      user: newUser._id
    });

    // Link profile back to User
    newUser.profileId = student._id;
    await newUser.save();

    await logAudit({
      req,
      action: 'ADD_STUDENT',
      module: 'Student Management',
      details: `Added student ${name} (${rollNumber})`,
      newValue: { studentId, rollNumber, name }
    });

    res.status(201).json({ success: true, data: student });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update student profile
// @route   PUT /api/students/:id
// @access  Private (Admin)
const updateStudent = async (req, res) => {
  try {
    const oldStudent = await Student.findById(req.params.id);
    if (!oldStudent) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )
      .populate('department', 'name code')
      .populate('course', 'name code')
      .populate('section', 'name');

    // Update corresponding User email if changed
    if (req.body.email && oldStudent.user) {
      await User.findByIdAndUpdate(oldStudent.user, { email: req.body.email.toLowerCase() });
    }

    await logAudit({
      req,
      action: 'EDIT_STUDENT',
      module: 'Student Management',
      details: `Updated student ${updatedStudent.name} (${updatedStudent.rollNumber})`,
      oldValue: oldStudent,
      newValue: updatedStudent
    });

    res.json({ success: true, data: updatedStudent });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete/Deactivate student
// @route   DELETE /api/students/:id
// @access  Private (Admin)
const deleteStudent = async (req, res) => {
  try {
    const student = await Student.findById(req.params.id);
    if (!student) {
      return res.status(404).json({ success: false, message: 'Student not found' });
    }

    // Toggle isActive or hard delete depending on query flag ?permanent=true
    if (req.query.permanent === 'true') {
      if (student.user) {
        await User.findByIdAndDelete(student.user);
      }
      await Attendance.deleteMany({ student: student._id });
      await Student.findByIdAndDelete(req.params.id);
    } else {
      student.isActive = false;
      await student.save();
      if (student.user) {
        await User.findByIdAndUpdate(student.user, { isActive: false });
      }
    }

    await logAudit({
      req,
      action: 'DELETE_STUDENT',
      module: 'Student Management',
      details: `Deactivated/Deleted student ${student.name} (${student.rollNumber})`,
      oldValue: student
    });

    res.json({ success: true, message: 'Student deactivated/removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getStudents,
  getStudentById,
  createStudent,
  updateStudent,
  deleteStudent
};
