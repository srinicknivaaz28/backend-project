// middleware/validation.js
const { validationResult } = require('express-validator');

// Generic validation result handler
const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map(error => ({
        field: error.path || error.param,
        message: error.msg,
        value: error.value
      }))
    });
  }
  
  next();
};

// File upload validation middleware
const validateFileUpload = (options = {}) => {
  const {
    maxSize = 5 * 1024 * 1024, // 5MB default
    allowedTypes = ['image/jpeg', 'image/png', 'image/gif'],
    required = false
  } = options;

  return (req, res, next) => {
    if (!req.file && required) {
      return res.status(400).json({
        success: false,
        message: 'File is required'
      });
    }

    if (!req.file && !required) {
      return next();
    }

    // Check file size
    if (req.file.size > maxSize) {
      return res.status(400).json({
        success: false,
        message: `File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB`
      });
    }

    // Check file type
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`
      });
    }

    next();
  };
};

// JSON payload size validation
const validatePayloadSize = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('Content-Length'));
    const maxBytes = typeof maxSize === 'string' 
      ? parseFloat(maxSize) * (maxSize.includes('mb') ? 1024 * 1024 : 1024)
      : maxSize;

    if (contentLength > maxBytes) {
      return res.status(413).json({
        success: false,
        message: 'Payload too large'
      });
    }

    next();
  };
};

// Custom validation for specific fields
const validateObjectId = (field = 'id') => {
  return (req, res, next) => {
    const value = req.params[field] || req.body[field];
    
    if (value && !/^[0-9a-fA-F]{24}$/.test(value)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${field} format`
      });
    }
    
    next();
  };
};

// Validate password strength
const validatePasswordStrength = (field = 'password') => {
  return (req, res, next) => {
    const password = req.body[field];
    
    if (!password) {
      return next();
    }

    const minLength = 8;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumbers = /\d/.test(password);
    const hasNonalphas = /\W/.test(password);

    const errors = [];

    if (password.length < minLength) {
      errors.push(`Password must be at least ${minLength} characters long`);
    }
    
    if (!hasUpperCase) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!hasLowerCase) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!hasNumbers) {
      errors.push('Password must contain at least one number');
    }
    
    if (!hasNonalphas) {
      errors.push('Password must contain at least one special character');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Password does not meet requirements',
        errors: errors
      });
    }

    next();
  };
};

// Validate email domain
const validateEmailDomain = (allowedDomains = []) => {
  return (req, res, next) => {
    const email = req.body.email;
    
    if (!email || allowedDomains.length === 0) {
      return next();
    }

    const domain = email.split('@')[1];
    
    if (!allowedDomains.includes(domain)) {
      return res.status(400).json({
        success: false,
        message: `Email domain not allowed. Allowed domains: ${allowedDomains.join(', ')}`
      });
    }

    next();
  };
};

// Sanitize and validate user input
const sanitizeUserInput = (req, res, next) => {
  // Trim whitespace from string fields
  const trimFields = (obj) => {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = obj[key].trim();
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        trimFields(obj[key]);
      }
    }
  };

  if (req.body) {
    trimFields(req.body);
  }

  // Remove empty strings and convert to null/undefined
  const removeEmptyStrings = (obj) => {
    for (const key in obj) {
      if (obj[key] === '') {
        delete obj[key];
      } else if (typeof obj[key] === 'object' && obj[key] !== null) {
        removeEmptyStrings(obj[key]);
      }
    }
  };

  if (req.body) {
    removeEmptyStrings(req.body);
  }

  next();
};

// Rate limit validation for specific users
const validateUserRateLimit = (operation, limit, windowMs = 15 * 60 * 1000) => {
  const userOperations = new Map();

  return (req, res, next) => {
    const userId = req.user?.id || req.ip;
    const now = Date.now();
    const windowStart = now - windowMs;

    if (!userOperations.has(userId)) {
      userOperations.set(userId, []);
    }

    const userOps = userOperations.get(userId);
    
    // Remove operations outside the window
    const validOps = userOps.filter(timestamp => timestamp > windowStart);
    userOperations.set(userId, validOps);

    if (validOps.length >= limit) {
      return res.status(429).json({
        success: false,
        message: `Too many ${operation} attempts. Please try again later.`,
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }

    // Add current operation
    validOps.push(now);
    next();
  };
};

module.exports = {
  handleValidationErrors,
  validateFileUpload,
  validatePayloadSize,
  validateObjectId,
  validatePasswordStrength,
  validateEmailDomain,
  sanitizeUserInput,
  validateUserRateLimit
};