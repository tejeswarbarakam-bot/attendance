const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Section = require('../models/Section');

const createPersonalStudentAccount = async () => {
  try {
    console.log('Connecting to MongoDB Atlas...');
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected.');

    const name = 'Tejeswar Barakam';
    const rollNumber = '24CS099';
    const studentId = '24CS099';
    const email = 'tejeswar.24cs099@gprec.ac.in';
    const password = 'Tejeswar@123';


    // Get CSE Department, B.Tech Course, Section A
    let dept = await Department.findOne({ code: 'CSE' });
    let course = await Course.findOne({ code: 'BTECH' });
    let section = await Section.findOne({ name: 'Section A' });

    // Delete if already existing
    const existingUser = await User.findOne({
      $or: [{ username: rollNumber.toLowerCase() }, { email: email.toLowerCase() }]
    });

    if (existingUser) {
      await Student.deleteMany({ user: existingUser._id });
      await User.findByIdAndDelete(existingUser._id);
      console.log('Cleaned up previous existing account.');
    }

    // 1. Create User
    const user = await User.create({
      username: rollNumber.toLowerCase(),
      email: email.toLowerCase(),
      password,
      role: 'student',
      roleRef: 'Student'
    });

    // 2. Create Student Profile
    const student = await Student.create({
      studentId,
      rollNumber,
      name,
      email: email.toLowerCase(),
      phone: '+91 9876543210',
      department: dept._id,
      course: course._id,
      year: '3rd Year',
      semester: 'Semester 1',
      section: section._id,
      academicYear: '2026-27',
      user: user._id
    });

    user.profileId = student._id;
    await user.save();

    console.log('=======================================================');
    console.log('  Personal Student Account Created Successfully!');
    console.log('  Name: ' + name);
    console.log('  Roll Number / ID: ' + rollNumber);
    console.log('  Email: ' + email);
    console.log('  Password: ' + password);
    console.log('=======================================================');

    process.exit(0);
  } catch (error) {
    console.error('Account Creation Error:', error);
    process.exit(1);
  }
};

createPersonalStudentAccount();
