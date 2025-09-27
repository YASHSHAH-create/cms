import mongoose, { Document, Schema } from 'mongoose';

export interface IEnquiry extends Document {
  visitorName: string;
  phoneNumber?: string;
  email?: string;
  enquiryType: 'chatbot' | 'email' | 'calls' | 'website';
  enquiryDetails: string;
  status: 'new' | 'in_progress' | 'resolved' | 'closed' | 'escalated';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  assignedAgent?: mongoose.Types.ObjectId;
  agentName?: string;
  visitorId?: mongoose.Types.ObjectId;
  organization?: string;
  location?: string;
  estimatedValue?: number;
  expectedCompletionDate?: Date;
  lastContactDate?: Date;
  nextFollowUpDate?: Date;
  resolutionNotes?: string;
  statusHistory: Array<{
    status: string;
    changedAt: Date;
    changedBy: string;
    notes?: string;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

const enquirySchema = new Schema<IEnquiry>({
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
    validate: {
      validator: function(v: string) {
        return !v || /^[0-9+\-()\s]{7,24}$/.test(v);
      },
      message: 'Invalid phone number format'
    }
  },
  email: {
    type: String,
    trim: true,
    lowercase: true,
    maxlength: 160,
    index: true,
    validate: {
      validator: function(v: string) {
        return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      },
      message: 'Invalid email format'
    }
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
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  agentName: {
    type: String,
    trim: true
  },
  visitorId: {
    type: Schema.Types.ObjectId,
    ref: 'Visitor'
  },
  organization: {
    type: String,
    trim: true,
    maxlength: 160
  },
  location: {
    type: String,
    trim: true,
    maxlength: 200
  },
  estimatedValue: {
    type: Number,
    min: 0
  },
  expectedCompletionDate: {
    type: Date
  },
  lastContactDate: {
    type: Date
  },
  nextFollowUpDate: {
    type: Date
  },
  resolutionNotes: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  statusHistory: [{
    status: {
      type: String,
      required: true
    },
    changedAt: {
      type: Date,
      default: Date.now
    },
    changedBy: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 500
    }
  }]
}, {
  timestamps: true
});

// Indexes
enquirySchema.index({ createdAt: -1 });
enquirySchema.index({ status: 1 });
enquirySchema.index({ enquiryType: 1 });
enquirySchema.index({ assignedAgent: 1 });
enquirySchema.index({ visitorId: 1 });
enquirySchema.index({ visitorId: 1, enquiryType: 1 }, { unique: true, sparse: true });

// Custom validation to ensure at least one contact method is provided
enquirySchema.pre('validate', function(next) {
  if (!this.phoneNumber && !this.email) {
    return next(new Error('At least one contact method (phone number or email) is required'));
  }
  next();
});

// Pre-save middleware to track status changes
enquirySchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (!this.statusHistory) {
      this.statusHistory = [];
    }
    this.statusHistory.push({
      status: this.status,
      changedAt: new Date(),
      changedBy: 'system',
      notes: `Status changed to ${this.status}`
    });
  }
  next();
});

// Create and export the model
const Enquiry = mongoose.models.Enquiry || mongoose.model<IEnquiry>('Enquiry', enquirySchema);
export default Enquiry;
