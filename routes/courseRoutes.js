const express = require('express');
const { body } = require('express-validator');
const router = express.Router();

const {
  getAllCourses,
  getCourseById,
  createCourse,
  updateCourse,
  deleteCourse,
  togglePublishCourse,
  getCourseStats
} = require('../controllers/courseController');

// Validation middleware
const validateCourse = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Course title is required')
    .isLength({ min: 3, max: 200 })
    .withMessage('Course title must be between 3 and 200 characters'),
  
  body('description')
    .trim()
    .notEmpty()
    .withMessage('Course description is required')
    .isLength({ min: 10, max: 1000 })
    .withMessage('Course description must be between 10 and 1000 characters'),
  
  body('thumbnailUrl')
    .optional()
    .isURL()
    .withMessage('Thumbnail URL must be a valid URL'),
  
  body('modules')
    .isArray({ min: 1 })
    .withMessage('Course must have at least one module'),
  
  body('level')
    .optional()
    .isIn(['Beginner', 'Intermediate', 'Advanced'])
    .withMessage('Level must be Beginner, Intermediate, or Advanced'),
  
  body('price')
    .optional()
    .isNumeric()
    .withMessage('Price must be a number')
    .custom(value => value >= 0)
    .withMessage('Price cannot be negative')
];

// Routes - order matters, put specific routes before parameterized ones
router.get('/stats', getCourseStats);
router.get('/', getAllCourses);
router.post('/', validateCourse, createCourse);
router.get('/:id', getCourseById);
router.put('/:id', validateCourse, updateCourse);
router.patch('/:id/toggle-publish', togglePublishCourse);
router.delete('/:id', deleteCourse);

module.exports = router;