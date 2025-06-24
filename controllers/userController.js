const User = require('../models/User');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');
const crypto = require('crypto');
const sendEmail = require('../utils/sendEmail'); // You'll need to implement this

// Helper function to generate tokens
const generateTokens = (user) => {
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();
  return { accessToken, refreshToken };
};

// Register user
const register = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    console.log('Validation errors:', errors.array().join(', '));
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { name, email, password } = req.body;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email'
      });
    }

    // Create new user
    const user = new User({
      name,
      email,
      password
    });

    // Generate email verification token
    const verificationToken = user.generateEmailVerificationToken();
    await user.save();

    // Send verification email (implement sendEmail utility)
    // try {
    //   await sendEmail({
    //     email: user.email,
    //     subject: 'Email Verification',
    //     message: `Please verify your email by clicking this link: ${process.env.CLIENT_URL}/verify-email/${verificationToken}`
    //   });
    // } catch (emailError) {
    //   console.error('Email sending failed:', emailError);
    // }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Add refresh token to user
    user.addRefreshToken(refreshToken);
    await user.save();

    res.status(201).json({
      success: true,
      message: 'User registered successfully. Please verify your email.',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Error creating user',
      error: error.message
    });
  }
};

// Login user
const login = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { email, password } = req.body;

    // Find user and include password for comparison
    const user = await User.findOne({ email }).select('+password');
    
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.'
      });
    }

    // Update last login
    user.lastLogin = new Date();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Add refresh token to user
    user.addRefreshToken(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during login',
      error: error.message
    });
  }
};

// Google OAuth callback
const googleAuth = async (req, res) => {
  try {
    const { googleId, email, name, avatar } = req.body;

    let user = await User.findOne({ 
      $or: [{ email }, { googleId }] 
    });

    if (user) {
      // Update existing user with Google info if needed
      if (!user.googleId) {
        user.googleId = googleId;
      }
      if (!user.avatar && avatar) {
        user.avatar = avatar;
      }
      user.isEmailVerified = true; // Google emails are verified
      user.lastLogin = new Date();
    } else {
      // Create new user
      user = new User({
        name,
        email,
        googleId,
        avatar: avatar || '',
        isEmailVerified: true
      });
    }

    await user.save();

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);
    
    // Add refresh token to user
    user.addRefreshToken(refreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Google authentication successful',
      data: {
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          avatar: user.avatar
        },
        accessToken,
        refreshToken
      }
    });

  } catch (error) {
    console.error('Google auth error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during Google authentication',
      error: error.message
    });
  }
};

// Refresh token
const refreshToken = async (req, res) => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token is required'
      });
    }

    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);
    
    // Find user and check if refresh token exists
    const user = await User.findById(decoded.id);
    if (!user || !user.refreshTokens.some(rt => rt.token === refreshToken)) {
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new tokens
    const { accessToken, refreshToken: newRefreshToken } = generateTokens(user);
    
    // Remove old refresh token and add new one
    user.removeRefreshToken(refreshToken);
    user.addRefreshToken(newRefreshToken);
    await user.save();

    res.status(200).json({
      success: true,
      data: {
        accessToken,
        refreshToken: newRefreshToken
      }
    });

  } catch (error) {
    console.error('Refresh token error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token',
      error: error.message
    });
  }
};

// Logout
const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    const userId = req.user.id;

    const user = await User.findById(userId);
    if (user && refreshToken) {
      user.removeRefreshToken(refreshToken);
      await user.save();
    }

    res.status(200).json({
      success: true,
      message: 'Logged out successfully'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Error during logout',
      error: error.message
    });
  }
};

// Get user profile
const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('purchasedCourses.courseId', 'title thumbnailUrl instructor category level')
      .populate('registeredCourses.courseId', 'title thumbnailUrl instructor category level')
      .populate('completedCourses.courseId', 'title thumbnailUrl instructor category level');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching profile',
      error: error.message
    });
  }
};

// Update user profile
const updateProfile = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const userId = req.user.id;
    const updateData = req.body;

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.email;
    delete updateData.googleId;
    delete updateData.role;
    delete updateData.isEmailVerified;
    delete updateData.refreshTokens;

    const user = await User.findByIdAndUpdate(
      userId,
      updateData,
      { 
        new: true, 
        runValidators: true 
      }
    ).populate('purchasedCourses.courseId', 'title thumbnailUrl instructor category level')
     .populate('registeredCourses.courseId', 'title thumbnailUrl instructor category level')
     .populate('completedCourses.courseId', 'title thumbnailUrl instructor category level');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Profile updated successfully',
      data: user
    });

  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating profile',
      error: error.message
    });
  }
};

// Change password
const changePassword = async (req, res) => {
  try {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Find user with password
    const user = await User.findById(userId).select('+password');
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has password (not Google user)
    if (!user.password) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change password for Google authenticated users'
      });
    }

    // Verify current password
    const isCurrentPasswordValid = await user.comparePassword(currentPassword);
    if (!isCurrentPasswordValid) {
      return res.status(400).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }

    // Update password
    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password changed successfully'
    });

  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error changing password',
      error: error.message
    });
  }
};

// Verify email
const verifyEmail = async (req, res) => {
  try {
    const { token } = req.params;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({
      _id: decoded.id,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired verification token'
      });
    }

    // Update user
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Email verified successfully'
    });

  } catch (error) {
    console.error('Email verification error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid verification token',
      error: error.message
    });
  }
};

// Forgot password
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found with this email'
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save();

    // Send reset email
    try {
      await sendEmail({
        email: user.email,
        subject: 'Password Reset',
        message: `Reset your password by clicking this link: ${process.env.CLIENT_URL}/reset-password/${resetToken}`
      });

      res.status(200).json({
        success: true,
        message: 'Password reset email sent'
      });
    } catch (emailError) {
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
      await user.save();

      throw new Error('Email could not be sent');
    }

  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Error sending password reset email',
      error: error.message
    });
  }
};

// Reset password
const resetPassword = async (req, res) => {
  try {
    const { token } = req.params;
    const { password } = req.body;

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findOne({
      _id: decoded.id,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: 'Invalid or expired reset token'
      });
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(400).json({
      success: false,
      message: 'Invalid reset token',
      error: error.message
    });
  }
};

// Get user dashboard stats
const getDashboardStats = async (req, res) => {
  try {
    const userId = req.user.id;
    
    const user = await User.findById(userId)
      .populate('registeredCourses.courseId', 'title')
      .populate('completedCourses.courseId', 'title')
      .populate('certificates.courseId', 'title');

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    const stats = {
      totalRegisteredCourses: user.registeredCourses.length,
      totalCompletedCourses: user.completedCourses.length,
      totalCertificates: user.certificates.length,
      totalPurchasedCourses: user.purchasedCourses.length,
      recentActivity: {
        recentRegistrations: user.registeredCourses
          .sort((a, b) => new Date(b.registrationDate) - new Date(a.registrationDate))
          .slice(0, 5),
        recentCompletions: user.completedCourses
          .sort((a, b) => new Date(b.completionDate) - new Date(a.completionDate))
          .slice(0, 5)
      }
    };

    res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching dashboard stats',
      error: error.message
    });
  }
};

module.exports = {
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
};