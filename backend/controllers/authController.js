const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const { generateToken } = require('../utils/helpers');
const { logAudit } = require('../utils/auditLogger');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = async (req, res) => {
  try {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please provide identifier, password, and role' });
    }

    // Search user by email, username, roll number, or facultyId
    let queryUser = await User.findOne({
      $or: [
        { email: username.toLowerCase().trim() },
        { username: username.toLowerCase().trim() }
      ],
      role: role.toLowerCase()
    }).select('+password');

    // If not found by direct username/email, try finding student/faculty profile by ID/rollNumber
    if (!queryUser && role === 'student') {
      const student = await Student.findOne({
        $or: [
          { rollNumber: username.trim() },
          { studentId: username.trim() },
          { email: username.toLowerCase().trim() }
        ]
      });
      if (student && student.user) {
        queryUser = await User.findById(student.user).select('+password');
      }
    } else if (!queryUser && role === 'faculty') {
      const faculty = await Faculty.findOne({
        $or: [
          { facultyId: username.trim() },
          { email: username.toLowerCase().trim() }
        ]
      });
      if (faculty && faculty.user) {
        queryUser = await User.findById(faculty.user).select('+password');
      }
    }

    if (!queryUser) {
      return res.status(401).json({ success: false, message: 'Invalid credentials or role mismatch' });
    }

    // Strict Student Restriction: Students must have @gprec.ac.in email
    if (queryUser.role === 'student' && !queryUser.email.endsWith('@gprec.ac.in')) {
      return res.status(403).json({
        success: false,
        message: 'Students are strictly required to log in using an official @gprec.ac.in email address via Google authentication.'
      });
    }

    if (!queryUser.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated. Please contact Admin.' });
    }


    const isMatch = await queryUser.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    // Fetch full profile info depending on role
    let profileData = null;
    if (queryUser.role === 'student') {
      profileData = await Student.findOne({ user: queryUser._id })
        .populate('department', 'name code')
        .populate('course', 'name code')
        .populate('section', 'name');
    } else if (queryUser.role === 'faculty') {
      profileData = await Faculty.findOne({ user: queryUser._id })
        .populate('department', 'name code');
    }

    const token = generateToken(queryUser._id);

    req.user = queryUser;
    await logAudit({
      req,
      action: 'LOGIN',
      module: 'Authentication',
      details: `User ${queryUser.username} logged in successfully as ${queryUser.role}`
    });

    res.json({
      success: true,
      token,
      user: {
        _id: queryUser._id,
        username: queryUser.username,
        email: queryUser.email,
        role: queryUser.role,
        profile: profileData
      }
    });
  } catch (error) {
    console.error('Login Controller Error:', error);
    res.status(500).json({ success: false, message: 'Server error during authentication' });
  }
};

// @desc    Get current logged in user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    let profileData = null;

    if (user.role === 'student') {
      profileData = await Student.findOne({ user: user._id })
        .populate('department', 'name code')
        .populate('course', 'name code')
        .populate('section', 'name');
    } else if (user.role === 'faculty') {
      profileData = await Faculty.findOne({ user: user._id })
        .populate('department', 'name code');
    }

    res.json({
      success: true,
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        role: user.role,
        profile: profileData
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Logout user (Audit logging)
// @route   POST /api/auth/logout
// @access  Private
const logout = async (req, res) => {
  try {
    await logAudit({
      req,
      action: 'LOGOUT',
      module: 'Authentication',
      details: `User ${req.user.username} logged out`
    });
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Register a new Student or Faculty account
// @route   POST /api/auth/register
// @access  Public
const register = async (req, res) => {
  try {
    const { name, email, identifier, password, role, departmentCode } = req.body;

    if (!name || !email || !identifier || !password || !role) {
      return res.status(400).json({ success: false, message: 'Please fill out all required registration fields' });
    }

    // Find department or default to CSE
    const Department = require('../models/Department');
    const Course = require('../models/Course');
    const Section = require('../models/Section');

    let dept = await Department.findOne({ code: (departmentCode || 'CSE').toUpperCase() });
    if (!dept) dept = await Department.findOne();

    let course = await Course.findOne();
    let section = await Section.findOne();

    // Check duplicate
    const existing = await User.findOne({
      $or: [{ username: identifier.toLowerCase().trim() }, { email: email.toLowerCase().trim() }]
    });

    if (existing) {
      return res.status(400).json({ success: false, message: 'Roll Number / ID or Email already registered' });
    }

    if (role === 'student') {
      const newUser = await User.create({
        username: identifier.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        role: 'student',
        roleRef: 'Student'
      });

      const newStudent = await Student.create({
        studentId: identifier.trim(),
        rollNumber: identifier.trim(),
        name,
        email: email.toLowerCase().trim(),
        department: dept._id,
        course: course._id,
        year: '3rd Year',
        semester: 'Semester 1',
        section: section._id,
        academicYear: '2026-27',
        user: newUser._id
      });

      newUser.profileId = newStudent._id;
      await newUser.save();

      const token = generateToken(newUser._id);
      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          profile: newStudent
        }
      });
    } else if (role === 'faculty') {
      const newUser = await User.create({
        username: identifier.toLowerCase().trim(),
        email: email.toLowerCase().trim(),
        password,
        role: 'faculty',
        roleRef: 'Faculty'
      });

      const newFaculty = await Faculty.create({
        facultyId: identifier.trim(),
        name,
        email: email.toLowerCase().trim(),
        department: dept._id,
        designation: 'Assistant Professor',
        user: newUser._id
      });

      newUser.profileId = newFaculty._id;
      await newUser.save();

      const token = generateToken(newUser._id);
      return res.status(201).json({
        success: true,
        token,
        user: {
          _id: newUser._id,
          username: newUser.username,
          email: newUser.email,
          role: newUser.role,
          profile: newFaculty
        }
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid registration role' });
    }
  } catch (error) {
    console.error('Registration Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Firebase Auth Sync & Login with Domain Check
// @route   POST /api/auth/firebase-login
// @access  Public
const firebaseLogin = async (req, res) => {
  try {
    const { email, role, firebaseUid } = req.body;

    if (!email || !role) {
      return res.status(400).json({ success: false, message: 'Email and Role are required for authentication' });
    }

    const cleanEmail = email.toLowerCase().trim();

    // Enforce Institutional Domain Restriction
    if (!cleanEmail.endsWith('@gprec.ac.in')) {
      return res.status(403).json({
        success: false,
        message: 'Access Restricted! Only official college emails ending with @gprec.ac.in are allowed.'
      });
    }

    // Check if user exists in MongoDB Atlas
    let queryUser = await User.findOne({ email: cleanEmail });

    if (!queryUser) {
      const Student = require('../models/Student');
      const Faculty = require('../models/Faculty');
      const Department = require('../models/Department');
      const Course = require('../models/Course');
      const Section = require('../models/Section');

      let dept = await Department.findOne() || { _id: new mongoose.Types.ObjectId() };
      let course = await Course.findOne() || { _id: new mongoose.Types.ObjectId() };
      let section = await Section.findOne() || { _id: new mongoose.Types.ObjectId() };

      // Auto-register student or faculty if email belongs to @gprec.ac.in
      const usernameFromEmail = cleanEmail.split('@')[0];

      if (role === 'student') {
        queryUser = await User.create({
          username: usernameFromEmail,
          email: cleanEmail,
          password: 'GoogleUser@123',
          role: 'student',
          roleRef: 'Student'
        });

        const newStudent = await Student.create({
          studentId: usernameFromEmail.toUpperCase(),
          rollNumber: usernameFromEmail.toUpperCase(),
          name: usernameFromEmail.replace('.', ' ').toUpperCase(),
          email: cleanEmail,
          department: dept._id,
          course: course._id,
          year: '3rd Year',
          semester: 'Semester 1',
          section: section._id,
          academicYear: '2026-27',
          user: queryUser._id
        });

        queryUser.profileId = newStudent._id;
        await queryUser.save();
      } else if (role === 'faculty') {
        queryUser = await User.create({
          username: usernameFromEmail,
          email: cleanEmail,
          password: 'GoogleUser@123',
          role: 'faculty',
          roleRef: 'Faculty'
        });

        const newFaculty = await Faculty.create({
          facultyId: usernameFromEmail.toUpperCase(),
          name: usernameFromEmail.replace('.', ' ').toUpperCase(),
          email: cleanEmail,
          department: dept._id,
          designation: 'Assistant Professor',
          user: queryUser._id
        });

        queryUser.profileId = newFaculty._id;
        await queryUser.save();
      }
    }

    if (!queryUser.isActive) {
      return res.status(401).json({ success: false, message: 'Account is deactivated' });
    }

    let profileData = null;
    const Student = require('../models/Student');
    const Faculty = require('../models/Faculty');

    if (queryUser.role === 'student') {
      profileData = await Student.findOne({ user: queryUser._id })
        .populate('department', 'name code')
        .populate('course', 'name code')
        .populate('section', 'name');
    } else if (queryUser.role === 'faculty') {
      profileData = await Faculty.findOne({ user: queryUser._id })
        .populate('department', 'name code');
    }

    const token = generateToken(queryUser._id);

    req.user = queryUser;
    await logAudit({
      req,
      action: 'GOOGLE_AUTH_LOGIN',
      module: 'Authentication',
      details: `User ${queryUser.username} authenticated via Google (@gprec.ac.in)`
    });

    res.json({
      success: true,
      token,
      user: {
        _id: queryUser._id,
        username: queryUser.username,
        email: queryUser.email,
        role: queryUser.role,
        profile: profileData
      }
    });
  } catch (error) {
    console.error('Google Auth Controller Error:', error);
    res.status(500).json({ success: false, message: error.message });
  }
};


module.exports = { login, register, firebaseLogin, getMe, logout };


