const express = require('express');
const { body } = require('express-validator');
const router = express.Router();
const {
  register,
  login,
  googleAuth,
  refreshToken,
  logout,
  getProfile,
  updateProfile,
  changePassword,
  verifyEmail,
  forgotPassword,
  resetPassword,
  getDashboardStats
} = require('../controllers/userController');
const { auth } = require('../middleware/auth'); // Auth middleware

// Validation middleware
const validateRegister = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Name is required')
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  

];

const validateLogin = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address'),
  
  body('password')
    .notEmpty()
    .withMessage('Password is required')
];

const validateUpdateProfile = [
  body('name')
    .optional()
    .trim()
    .isLength({ min: 2, max: 100 })
    .withMessage('Name must be between 2 and 100 characters'),
  
  body('phone')
    .optional()
    .isMobilePhone()
    .withMessage('Please provide a valid phone number'),
  
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('Bio must not exceed 500 characters'),
  
  body('dateOfBirth')
    .optional()
    .isDate()
    .withMessage('Please provide a valid date of birth'),
  
  body('location')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Location must not exceed 100 characters')
];

const validateChangePassword = [
  body('currentPassword')
    .notEmpty()
    .withMessage('Current password is required'),
  
  body('newPassword')
    .isLength({ min: 8 })
    .withMessage('New password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/)
    .withMessage('New password must contain at least one uppercase letter, one lowercase letter, one number, and one special character'),
  
  body('confirmNewPassword')
    .custom((value, { req }) => {
      if (value !== req.body.newPassword) {
        throw new Error('New passwords do not match');
      }
      return true;
    })
];

const validateForgotPassword = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Please provide a valid email address')
];

const validateResetPassword = [
  body('password')
    .isLength({ min: 8 })
    .withMessage('Password must be at least 8 characters long')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
    .withMessage('Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character (@$!%*?&)')
];

// Public routes (no authentication required)
router.post('/register',validateRegister, register);
router.post('/login', validateLogin, login);
router.post('/google-auth', googleAuth);
router.post('/refresh-token', refreshToken);
router.post('/forgot-password', validateForgotPassword, forgotPassword);
router.post('/reset-password/:token', validateResetPassword, resetPassword);
router.get('/verify-email/:token', verifyEmail);

// Protected routes (authentication required)
router.post('/logout', auth, logout);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, validateUpdateProfile, updateProfile);
router.post('/change-password', auth, validateChangePassword, changePassword);
router.get('/dashboard-stats', auth, getDashboardStats);

module.exports = router;