const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Define sub-schemas
const certificateSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  courseTitle: {
    type: String,
    required: true
  },
  certificateId: {
    type: String,
    required: true
  },
  issuedDate: {
    type: Date,
    default: Date.now
  },
  certificateUrl: {
    type: String,
    default: ''
  }
});

const purchasedCourseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  purchaseDate: {
    type: Date,
    default: Date.now
  },
  amount: {
    type: Number,
    required: true
  },
  paymentMethod: {
    type: String,
    default: 'card'
  },
  transactionId: {
    type: String,
    required: true
  }
});

const completedCourseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  completionDate: {
    type: Date,
    default: Date.now
  },
  completionPercentage: {
    type: Number,
    default: 100,
    min: 0,
    max: 100
  },
  timeSpent: {
    type: Number, // in minutes
    default: 0
  }
});

const registeredCourseSchema = new mongoose.Schema({
  courseId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Course',
    required: true
  },
  registrationDate: {
    type: Date,
    default: Date.now
  },
  progress: {
    type: Number,
    default: 0,
    min: 0,
    max: 100
  },
  lastAccessedDate: {
    type: Date,
    default: Date.now
  },
  completedLessons: [{
    moduleId: Number,
    lessonId: Number,
    completedAt: {
      type: Date,
      default: Date.now
    }
  }]
});

// Main User schema
const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required'],
    trim: true,
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email']
  },
  password: {
    type: String,
    required: function () {
      return !this.googleId;
    },
    minlength: [6, 'Password must be at least 6 characters'],
    select: false
  },
  googleId: {
    type: String,
    sparse: true
  },
  avatar: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: '',
    match: [/^\+?[\d\s-()]+$/, 'Please enter a valid phone number']
  },
  education: {
    degree: { type: String, default: '' },
    field: { type: String, default: '' },
    institution: { type: String, default: '' },
    graduationYear: {
      type: Number,
      min: 1950,
      max: new Date().getFullYear() + 10
    }
  },
  address: {
    street: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    country: { type: String, default: '' },
    zipCode: { type: String, default: '' }
  },
  dateOfBirth: Date,
  gender: {
    type: String,
    enum: ['Male', 'Female', 'Other', ''],
    default: ''
  },
  bio: {
    type: String,
    maxlength: [500, 'Bio cannot exceed 500 characters'],
    default: ''
  },
  interests: [String],

  purchasedCourses: [purchasedCourseSchema],
  completedCourses: [completedCourseSchema],
  registeredCourses: [registeredCourseSchema],
  certificates: [certificateSchema],

  isEmailVerified: {
    type: Boolean,
    default: false
  },
  emailVerificationToken: {
    type: String,
    select: false
  },
  emailVerificationExpires: {
    type: Date,
    select: false
  },
  passwordResetToken: {
    type: String,
    select: false
  },
  passwordResetExpires: {
    type: Date,
    select: false
  },
  role: {
    type: String,
    enum: ['student', 'instructor', 'admin'],
    default: 'student'
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: Date,

  refreshTokens: [{
    token: { type: String, required: true },
    createdAt: {
      type: Date,
      default: Date.now,
      expires: 604800 // 7 days
    }
  }]
}, {
  timestamps: true
});

// 🔧 Index cleanup (DO NOT duplicate)
userSchema.index({ email: 1 }, { unique: true });
userSchema.index({ googleId: 1 }, { sparse: true });

// Virtuals
userSchema.virtual('totalPurchasedCourses').get(function () {
  return this.purchasedCourses.length;
});
userSchema.virtual('totalCompletedCourses').get(function () {
  return this.completedCourses.length;
});
userSchema.virtual('totalCertificates').get(function () {
  return this.certificates.length;
});

// Password hash middleware
userSchema.pre('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  const salt = await bcrypt.genSalt(12);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Instance methods
userSchema.methods.comparePassword = async function (candidatePassword) {
  if (!this.password) return false;
  return bcrypt.compare(candidatePassword, this.password);
};

// In models/User.js
userSchema.methods.generateAuthToken = function() {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign(
    { id: this._id, role: this.role },
    process.env.JWT_SECRET,
    { expiresIn: '15m' }
  );
};

userSchema.methods.generateRefreshToken = function () {
  return jwt.sign({
    id: this._id,
    type: 'refresh'
  }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '7d'
  });
};

userSchema.methods.generateEmailVerificationToken = function () {
  const token = jwt.sign({
    id: this._id,
    email: this.email
  }, process.env.JWT_SECRET, { expiresIn: '24h' });

  this.emailVerificationToken = token;
  this.emailVerificationExpires = Date.now() + 24 * 60 * 60 * 1000;
  return token;
};

userSchema.methods.generatePasswordResetToken = function () {
  const token = jwt.sign({
    id: this._id,
    email: this.email
  }, process.env.JWT_SECRET, { expiresIn: '1h' });

  this.passwordResetToken = token;
  this.passwordResetExpires = Date.now() + 60 * 60 * 1000;
  return token;
};

userSchema.methods.addRefreshToken = function (token) {
  this.refreshTokens.push({ token });
  if (this.refreshTokens.length > 5) {
    this.refreshTokens = this.refreshTokens.slice(-5);
  }
};

userSchema.methods.removeRefreshToken = function (token) {
  this.refreshTokens = this.refreshTokens.filter(rt => rt.token !== token);
};

userSchema.methods.hasPurchasedCourse = function (courseId) {
  return this.purchasedCourses.some(course => course.courseId.toString() === courseId.toString());
};

userSchema.methods.isRegisteredForCourse = function (courseId) {
  return this.registeredCourses.some(course => course.courseId.toString() === courseId.toString());
};

userSchema.methods.getCourseProgress = function (courseId) {
  const regCourse = this.registeredCourses.find(course => course.courseId.toString() === courseId.toString());
  return regCourse ? regCourse.progress : 0;
};

// Clean output JSON
userSchema.set('toJSON', {
  virtuals: true,
  transform: (doc, ret) => {
    delete ret.password;
    delete ret.emailVerificationToken;
    delete ret.emailVerificationExpires;
    delete ret.passwordResetToken;
    delete ret.passwordResetExpires;
    delete ret.refreshTokens;
    return ret;
  }
});

userSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('User', userSchema);
