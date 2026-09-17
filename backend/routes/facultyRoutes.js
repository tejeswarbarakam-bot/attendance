const express = require('express');
const router = express.Router();
const {
  getFaculty,
  getFacultyById,
  createFaculty,
  updateFaculty,
  deleteFaculty
} = require('../controllers/facultyController');
const { protect, authorize } = require('../middleware/authMiddleware');

router
  .route('/')
  .get(protect, getFaculty)
  .post(protect, authorize('admin'), createFaculty);

router
  .route('/:id')
  .get(protect, getFacultyById)
  .put(protect, authorize('admin'), updateFaculty)
  .delete(protect, authorize('admin'), deleteFaculty);

module.exports = router;
