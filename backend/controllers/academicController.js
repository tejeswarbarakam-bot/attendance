const Department = require('../models/Department');
const Course = require('../models/Course');
const Class = require('../models/Class');
const Section = require('../models/Section');
const Subject = require('../models/Subject');
const Assignment = require('../models/Assignment');
const { logAudit } = require('../utils/auditLogger');

// --- DEPARTMENTS ---
const getDepartments = async (req, res) => {
  try {
    const departments = await Department.find().sort({ name: 1 });
    res.json({ success: true, count: departments.length, data: departments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createDepartment = async (req, res) => {
  try {
    const { name, code } = req.body;
    const dept = await Department.create({ name, code: code.toUpperCase() });
    await logAudit({ req, action: 'ADD_DEPARTMENT', module: 'Academic Management', details: `Added department ${name} (${code})` });
    res.status(201).json({ success: true, data: dept });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// --- COURSES ---
const getCourses = async (req, res) => {
  try {
    const courses = await Course.find().populate('department', 'name code').sort({ name: 1 });
    res.json({ success: true, count: courses.length, data: courses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createCourse = async (req, res) => {
  try {
    const { name, code, department } = req.body;
    const course = await Course.create({ name, code: code.toUpperCase(), department });
    await logAudit({ req, action: 'ADD_COURSE', module: 'Academic Management', details: `Added course ${name} (${code})` });
    res.status(201).json({ success: true, data: course });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// --- SECTIONS ---
const getSections = async (req, res) => {
  try {
    const sections = await Section.find().sort({ name: 1 });
    res.json({ success: true, count: sections.length, data: sections });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSection = async (req, res) => {
  try {
    const { name } = req.body;
    const section = await Section.create({ name: name.toUpperCase() });
    res.status(201).json({ success: true, data: section });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// --- CLASSES ---
const getClasses = async (req, res) => {
  try {
    const classes = await Class.find()
      .populate('course', 'name code')
      .populate('department', 'name code')
      .populate('section', 'name')
      .sort({ year: 1, semester: 1 });
    res.json({ success: true, count: classes.length, data: classes });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createClass = async (req, res) => {
  try {
    const { course, department, year, semester, section, academicYear } = req.body;
    const newClass = await Class.create({ course, department, year, semester, section, academicYear });
    await logAudit({ req, action: 'ADD_CLASS', module: 'Academic Management', details: `Created class ${year} ${semester}` });
    res.status(201).json({ success: true, data: newClass });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// --- SUBJECTS ---
const getSubjects = async (req, res) => {
  try {
    const { department, semester } = req.query;
    const filter = {};
    if (department) filter.department = department;
    if (semester) filter.semester = semester;

    const subjects = await Subject.find(filter)
      .populate('department', 'name code')
      .sort({ subjectCode: 1 });
    res.json({ success: true, count: subjects.length, data: subjects });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createSubject = async (req, res) => {
  try {
    const { subjectCode, subjectName, department, semester, credits, subjectType } = req.body;
    const subject = await Subject.create({
      subjectCode: subjectCode.toUpperCase(),
      subjectName,
      department,
      semester,
      credits,
      subjectType
    });
    await logAudit({ req, action: 'ADD_SUBJECT', module: 'Academic Management', details: `Added subject ${subjectName} (${subjectCode})` });
    res.status(201).json({ success: true, data: subject });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// --- FACULTY ASSIGNMENTS ---
const getAssignments = async (req, res) => {
  try {
    const { faculty, subject, classId } = req.query;
    const filter = {};
    if (faculty) filter.faculty = faculty;
    if (subject) filter.subject = subject;
    if (classId) filter.class = classId;

    const assignments = await Assignment.find(filter)
      .populate('faculty', 'name facultyId email')
      .populate('subject', 'subjectCode subjectName credits')
      .populate({
        path: 'class',
        populate: [
          { path: 'course', select: 'name code' },
          { path: 'department', select: 'name code' },
          { path: 'section', select: 'name' }
        ]
      });
    res.json({ success: true, count: assignments.length, data: assignments });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

const createAssignment = async (req, res) => {
  try {
    const { faculty, subject, class: classId, academicYear, semester } = req.body;
    const assignment = await Assignment.create({
      faculty,
      subject,
      class: classId,
      academicYear,
      semester
    });
    await logAudit({ req, action: 'ASSIGN_FACULTY', module: 'Academic Management', details: `Assigned faculty to subject/class` });
    res.status(201).json({ success: true, data: assignment });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

const deleteAssignment = async (req, res) => {
  try {
    await Assignment.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Assignment removed' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

module.exports = {
  getDepartments,
  createDepartment,
  getCourses,
  createCourse,
  getSections,
  createSection,
  getClasses,
  createClass,
  getSubjects,
  createSubject,
  getAssignments,
  createAssignment,
  deleteAssignment
};
