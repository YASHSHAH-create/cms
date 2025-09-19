const mongoose = require('mongoose');

const EnquirySchema = new mongoose.Schema(
  {
    visitorName: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 120 
    },
    phoneNumber: { 
      type: String, 
      trim: true, 
      maxlength: 24,
      index: { sparse: true },
      validate: v => !v || /^[0-9+\-()\s]{7,24}$/.test(v)
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      index: true,
      validate: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    },
    enquiryType: { 
      type: String, 
      required: true,
      enum: ['chatbot', 'email', 'calls', 'website'],
      default: 'chatbot'
    },
    enquiryDetails: { 
      type: String, 
      required: true, 
      trim: true, 
      maxlength: 2000 
    },
    status: { 
      type: String, 
      default: 'new',
      enum: ['new', 'in_progress', 'resolved', 'closed', 'escalated']
    },
    priority: { 
      type: String, 
      default: 'medium',
      enum: ['low', 'medium', 'high', 'urgent']
    },
    assignedAgent: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'User' 
    },
    // Reference to visitor if created from chatbot
    visitorId: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Visitor' 
    },
    // Additional fields
    organization: { type: String, trim: true, maxlength: 160 },
    location: { type: String, trim: true, maxlength: 200 },
    estimatedValue: { type: Number, min: 0 },
    expectedCompletionDate: { type: Date },
    // Tracking fields
    lastContactDate: { type: Date },
    nextFollowUpDate: { type: Date },
    resolutionNotes: { type: String, trim: true, maxlength: 1000 },
    // Status history
    statusHistory: [{
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: String, trim: true },
      notes: { type: String, trim: true, maxlength: 500 }
    }]
  },
  { timestamps: true }
);

EnquirySchema.index({ createdAt: -1 });
EnquirySchema.index({ status: 1 });
EnquirySchema.index({ enquiryType: 1 });
EnquirySchema.index({ assignedAgent: 1 });
EnquirySchema.index({ visitorId: 1 });
// Compound index to prevent duplicate enquiries for same visitor
EnquirySchema.index({ visitorId: 1, enquiryType: 1 }, { unique: true, sparse: true });

// Custom validation to ensure at least one contact method is provided
EnquirySchema.pre('validate', function(next) {
  if (!this.phoneNumber && !this.email) {
    return next(new Error('At least one contact method (phone number or email) is required'));
  }
  next();
});

// Pre-save middleware to track status changes
EnquirySchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: 'system', // This will be updated by the API
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

module.exports = mongoose.model('Enquiry', EnquirySchema);
