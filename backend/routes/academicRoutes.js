const express = require('express');
const router = express.Router();
const {
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
} = require('../controllers/academicController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Departments
router.route('/departments').get(getDepartments).post(protect, authorize('admin'), createDepartment);

// Courses
router.route('/courses').get(getCourses).post(protect, authorize('admin'), createCourse);

// Sections
router.route('/sections').get(getSections).post(protect, authorize('admin'), createSection);

// Classes
router.route('/classes').get(getClasses).post(protect, authorize('admin'), createClass);

// Subjects
router.route('/subjects').get(getSubjects).post(protect, authorize('admin'), createSubject);

// Faculty Assignments
router.route('/assignments').get(protect, getAssignments).post(protect, authorize('admin'), createAssignment);
router.route('/assignments/:id').delete(protect, authorize('admin'), deleteAssignment);

module.exports = router;
