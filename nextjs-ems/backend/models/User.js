const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      minlength: 3,
      maxlength: 30,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
      lowercase: true,
      match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please fill a valid email address'],
    },
    password: {
      type: String,
      required: true,
      minlength: 6, // Enforce minimum password length
    },
    role: {
      type: String,
      enum: ['admin', 'executive', 'sales-executive', 'customer-executive'],
      required: true,
      default: 'customer-executive', // Default role if not specified
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 50,
    },
    apiKey: {
      type: String,
      trim: true,
      default: null, // Optional field for future use
    },
    region: {
      type: String,
      trim: true,
      maxlength: 120,
      default: null, // Region assignment for sales executives
    },
    // Enhanced fields for multi-executive system
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: null,
    },
    specializations: {
      type: [String],
      default: [], // Services they handle (e.g., ["Industrial Testing", "Water Quality"])
    },
    isActive: {
      type: Boolean,
      default: true, // Account status
    },
    isApproved: {
      type: Boolean,
      default: false, // For registration approval workflow
    },
    approvedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null, // Admin who approved the registration
    },
    approvedAt: {
      type: Date,
      default: null,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  {
    timestamps: true, // Adds createdAt and updatedAt
  }
);

// Pre-save hook to hash password
UserSchema.pre('save', async function (next) {
  if (this.isModified('password') || this.isNew) {
    this.password = await bcrypt.hash(this.password, 10);
  }
  next();
});

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);