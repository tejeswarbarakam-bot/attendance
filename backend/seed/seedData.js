const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

const User = require('../models/User');
const Student = require('../models/Student');
const Faculty = require('../models/Faculty');
const Department = require('../models/Department');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');
const Attendance = require('../models/Attendance');
const Notification = require('../models/Notification');
const Settings = require('../models/Settings');
const AuditLog = require('../models/AuditLog');

const seedData = async () => {
  try {
    console.log('Connecting to database for seeding...');
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/college_attendance');
    console.log('Connected to MongoDB.');

    // Clear existing data
    await User.deleteMany({});
    await Student.deleteMany({});
    await Faculty.deleteMany({});
    await Department.deleteMany({});
    await Course.deleteMany({});
    await Class.deleteMany({});
    await Section.deleteMany({});
    await Subject.deleteMany({});
    await Assignment.deleteMany({});
    await Attendance.deleteMany({});
    await Notification.deleteMany({});
    await Settings.deleteMany({});
    await AuditLog.deleteMany({});

    console.log('Database cleared.');

    // 1. Create Default Settings
    const settings = await Settings.create({
      minAttendancePercentage: 75,
      allowFacultyEdit: true,
      currentAcademicYear: '2026-27',
      currentSemester: 'Semester 1',
      collegeName: 'Apex Institute of Technology & Science'
    });
    console.log('Settings created.');

    // 2. Create Admin Account
    const adminUser = await User.create({
      username: 'admin',
      email: (process.env.ADMIN_EMAIL || 'admin@college.edu').toLowerCase(),
      password: process.env.ADMIN_PASSWORD || 'Admin@123',
      role: 'admin'
    });
    console.log(`Admin user created: ${adminUser.email} / Password: Admin@123`);

    // 3. Create Departments
    const deptCSE = await Department.create({ name: 'Computer Science and Engineering', code: 'CSE' });
    const deptECE = await Department.create({ name: 'Electronics and Communication Engineering', code: 'ECE' });
    const deptME = await Department.create({ name: 'Mechanical Engineering', code: 'ME' });
    console.log('Departments created.');

    // 4. Create Course & Sections
    const courseBTech = await Course.create({ name: 'B.Tech', code: 'BTECH', department: deptCSE._id });
    const secA = await Section.create({ name: 'Section A' });
    const secB = await Section.create({ name: 'Section B' });
    console.log('Course & Sections created.');

    // 5. Create Class
    const classCSE3 = await Class.create({
      course: courseBTech._id,
      department: deptCSE._id,
      year: '3rd Year',
      semester: 'Semester 1',
      section: secA._id,
      academicYear: '2026-27'
    });
    console.log('Class created.');

    // 6. Create Subjects
    const subDBMS = await Subject.create({
      subjectCode: 'CS301',
      subjectName: 'Database Management Systems',
      department: deptCSE._id,
      semester: 'Semester 1',
      credits: 4,
      subjectType: 'Theory'
    });

    const subCN = await Subject.create({
      subjectCode: 'CS302',
      subjectName: 'Computer Networks',
      department: deptCSE._id,
      semester: 'Semester 1',
      credits: 4,
      subjectType: 'Theory'
    });

    const subDAA = await Subject.create({
      subjectCode: 'CS303',
      subjectName: 'Design & Analysis of Algorithms',
      department: deptCSE._id,
      semester: 'Semester 1',
      credits: 3,
      subjectType: 'Theory'
    });

    console.log('Subjects created.');

    // 7. Create Faculty Members
    const facUser1 = await User.create({
      username: 'fac001',
      email: 'robert.vance@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      roleRef: 'Faculty'
    });

    const fac1 = await Faculty.create({
      facultyId: 'FAC001',
      name: 'Dr. Robert Vance',
      email: 'robert.vance@college.edu',
      phone: '+1 555-0192',
      department: deptCSE._id,
      designation: 'Associate Professor',
      user: facUser1._id
    });
    facUser1.profileId = fac1._id;
    await facUser1.save();

    const facUser2 = await User.create({
      username: 'fac002',
      email: 'sarah.jenkins@college.edu',
      password: 'Faculty@123',
      role: 'faculty',
      roleRef: 'Faculty'
    });

    const fac2 = await Faculty.create({
      facultyId: 'FAC002',
      name: 'Dr. Sarah Jenkins',
      email: 'sarah.jenkins@college.edu',
      phone: '+1 555-0193',
      department: deptCSE._id,
      designation: 'Assistant Professor',
      user: facUser2._id
    });
    facUser2.profileId = fac2._id;
    await facUser2.save();

    console.log('Faculty created: FAC001 (robert.vance@college.edu), FAC002 (sarah.jenkins@college.edu)');

    // 8. Assign Faculty to Subjects & Class
    await Assignment.create({
      faculty: fac1._id,
      subject: subDBMS._id,
      class: classCSE3._id,
      academicYear: '2026-27',
      semester: 'Semester 1'
    });

    await Assignment.create({
      faculty: fac1._id,
      subject: subCN._id,
      class: classCSE3._id,
      academicYear: '2026-27',
      semester: 'Semester 1'
    });

    await Assignment.create({
      faculty: fac2._id,
      subject: subDAA._id,
      class: classCSE3._id,
      academicYear: '2026-27',
      semester: 'Semester 1'
    });

    console.log('Faculty assignments created.');

    // 9. Create Students
    const studentList = [
      { id: '24CS001', roll: '24CS001', name: 'Aarav Sharma', email: 'aarav.sharma@student.edu' },
      { id: '24CS002', roll: '24CS002', name: 'Ananya Patel', email: 'ananya.patel@student.edu' },
      { id: '24CS003', roll: '24CS003', name: 'Rohan Gupta', email: 'rohan.gupta@student.edu' },
      { id: '24CS004', roll: '24CS004', name: 'Priya Verma', email: 'priya.verma@student.edu' },
      { id: '24CS005', roll: '24CS005', name: 'Vikram Singh', email: 'vikram.singh@student.edu' }
    ];

    const createdStudents = [];

    for (const st of studentList) {
      const u = await User.create({
        username: st.roll.toLowerCase(),
        email: st.email,
        password: 'Student@123',
        role: 'student',
        roleRef: 'Student'
      });

      const profile = await Student.create({
        studentId: st.id,
        rollNumber: st.roll,
        name: st.name,
        email: st.email,
        phone: '+1 555-010' + st.roll.slice(-1),
        department: deptCSE._id,
        course: courseBTech._id,
        year: '3rd Year',
        semester: 'Semester 1',
        section: secA._id,
        academicYear: '2026-27',
        user: u._id
      });

      u.profileId = profile._id;
      await u.save();
      createdStudents.push(profile);
    }

    console.log('5 Students created (24CS001 to 24CS005 / Password: Student@123).');

    // 10. Generate Sample Attendance Data over past dates
    const dates = [
      '2026-09-01', '2026-09-02', '2026-09-03', '2026-09-04', '2026-09-07',
      '2026-09-08', '2026-09-09', '2026-09-10', '2026-09-11', '2026-09-14',
      '2026-09-15', '2026-09-16'
    ];

    let attendanceCount = 0;

    for (const d of dates) {
      for (const st of createdStudents) {
        // DBMS (subDBMS - fac1)
        const dbmsPresent = (st.rollNumber === '24CS003' || st.rollNumber === '24CS005') ? Math.random() > 0.45 : Math.random() > 0.15;
        await Attendance.create({
          student: st._id,
          faculty: fac1._id,
          subject: subDBMS._id,
          class: classCSE3._id,
          department: deptCSE._id,
          date: d,
          period: 'Period 1',
          status: dbmsPresent ? 'Present' : 'Absent',
          academicYear: '2026-27',
          semester: 'Semester 1'
        });
        attendanceCount++;

        // CN (subCN - fac1)
        const cnPresent = (st.rollNumber === '24CS003') ? Math.random() > 0.6 : Math.random() > 0.2;
        await Attendance.create({
          student: st._id,
          faculty: fac1._id,
          subject: subCN._id,
          class: classCSE3._id,
          department: deptCSE._id,
          date: d,
          period: 'Period 2',
          status: cnPresent ? 'Present' : 'Absent',
          academicYear: '2026-27',
          semester: 'Semester 1'
        });
        attendanceCount++;

        // DAA (subDAA - fac2)
        const daaPresent = Math.random() > 0.25;
        await Attendance.create({
          student: st._id,
          faculty: fac2._id,
          subject: subDAA._id,
          class: classCSE3._id,
          department: deptCSE._id,
          date: d,
          period: 'Period 3',
          status: daaPresent ? 'Present' : 'Absent',
          academicYear: '2026-27',
          semester: 'Semester 1'
        });
        attendanceCount++;
      }
    }

    console.log(`Generated ${attendanceCount} realistic attendance records.`);

    // 11. Create Notifications
    await Notification.create({
      recipient: createdStudents[2].user, // Rohan Gupta (24CS003)
      targetRole: 'student',
      title: 'Attendance Shortage Warning',
      message: 'Your overall attendance in Computer Networks has fallen below 75%. Please contact your faculty.',
      type: 'warning'
    });

    await Notification.create({
      targetRole: 'all',
      title: 'Semester Mid-Term Exams Schedule',
      message: 'Mid-term examinations will begin from October 15, 2026. Ensure 75% attendance to sit for exams.',
      type: 'info'
    });

    console.log('Notifications created.');

    console.log('Database Seeding Completed Successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Seeding Failed:', error);
    process.exit(1);
  }
};

seedData();
