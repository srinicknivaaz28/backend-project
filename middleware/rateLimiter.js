// middleware/rateLimiter.js
const rateLimit = require('express-rate-limit');

// General rate limiter
const createRateLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: message || 'Too many requests, please try again later',
      retryAfter: Math.ceil(windowMs / 1000)
    },
    standardHeaders: true,
    legacyHeaders: false,
    handler: (req, res) => {
      res.status(429).json({
        success: false,
        message: message || 'Too many requests, please try again later',
        retryAfter: Math.ceil(windowMs / 1000)
      });
    }
  });
};

// Auth-specific rate limiters
const authLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 attempts
  'Too many authentication attempts, please try again in 15 minutes'
);

const loginLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many login attempts, please try again in 15 minutes'
);

const registerLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 registrations per hour
  'Too many registration attempts, please try again in 1 hour'
);

const passwordResetLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 attempts per hour
  'Too many password reset requests, please try again in 1 hour'
);

const emailVerificationLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  5, // 5 attempts per hour
  'Too many email verification requests, please try again in 1 hour'
);

const profileUpdateLimiter = createRateLimiter(
  15 * 60 * 1000, // 15 minutes
  10, // 10 updates per 15 minutes
  'Too many profile updates, please try again in 15 minutes'
);

const refreshTokenLimiter = createRateLimiter(
  5 * 60 * 1000, // 5 minutes
  20, // 20 refresh attempts
  'Too many token refresh attempts, please try again in 5 minutes'
);

// Strict limiter for sensitive operations
const strictLimiter = createRateLimiter(
  60 * 60 * 1000, // 1 hour
  1, // 1 attempt per hour
  'This action is rate limited. Please wait 1 hour before trying again'
);

module.exports = {
  authLimiter,
  loginLimiter,
  registerLimiter,
  passwordResetLimiter,
  emailVerificationLimiter,
  profileUpdateLimiter,
  refreshTokenLimiter,
  strictLimiter,
  createRateLimiter
};