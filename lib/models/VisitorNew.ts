import mongoose, { Document, Schema } from 'mongoose';

export interface IVisitorNew extends Document {
  name: string;
  email?: string;
  phone?: string;
  organization?: string;
  region?: string;
  service: string;
  subservice?: string;
  enquiryDetails?: string;
  source: 'chatbot' | 'email' | 'calls' | 'website';
  location?: string;
  meta?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
  lastInteractionAt: Date;
  isConverted: boolean;
  status: string;
  leadScore: number;
  priority: 'low' | 'medium' | 'high';
  pipelineHistory: Array<{
    status: string;
    changedAt: Date;
    changedBy: string;
    notes?: string;
  }>;
  agent?: string;
  agentName?: string;
  assignedAgent?: mongoose.Types.ObjectId;
  salesExecutive?: mongoose.Types.ObjectId;
  salesExecutiveName?: string;
  customerExecutive?: mongoose.Types.ObjectId;
  customerExecutiveName?: string;
  comments?: string;
  amount?: number;
  estimatedValue?: number;
  version?: number;
  lastModifiedBy?: string;
  lastModifiedAt?: Date;
  assignmentHistory?: Array<{
    assignedBy: string;
    assignedTo: string;
    assignedAt: Date;
    reason: string;
  }>;
}

const visitorSchema = new Schema<IVisitorNew>({
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: false,
    lowercase: true,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  organization: {
    type: String,
    trim: true
  },
  region: {
    type: String,
    trim: true
  },
  service: {
    type: String,
    required: true,
    trim: true
  },
  subservice: {
    type: String,
    trim: true
  },
  enquiryDetails: {
    type: String,
    trim: true
  },
  source: {
    type: String,
    enum: ['chatbot', 'email', 'calls', 'website'],
    default: 'chatbot'
  },
  location: {
    type: String,
    trim: true
  },
  meta: {
    type: Schema.Types.Mixed,
    default: {}
  },
  lastInteractionAt: {
    type: Date,
    default: Date.now
  },
  isConverted: {
    type: Boolean,
    default: false
  },
  status: {
    type: String,
    default: 'enquiry_required'
  },
  leadScore: {
    type: Number,
    default: 0
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  pipelineHistory: [{
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
      required: true
    },
    notes: {
      type: String
    }
  }],
  agent: {
    type: String,
    trim: true
  },
  agentName: {
    type: String,
    trim: true
  },
  assignedAgent: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  salesExecutive: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  salesExecutiveName: {
    type: String,
    trim: true
  },
  customerExecutive: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  customerExecutiveName: {
    type: String,
    trim: true
  },
  comments: {
    type: String,
    trim: true
  },
  amount: {
    type: Number,
    default: 0
  },
  estimatedValue: {
    type: Number,
    default: 0
  },
  version: {
    type: Number,
    default: 1
  },
  lastModifiedBy: {
    type: String,
    trim: true
  },
  lastModifiedAt: {
    type: Date
  },
  assignmentHistory: [{
    assignedBy: {
      type: String,
      required: true
    },
    assignedTo: {
      type: String,
      required: true
    },
    assignedAt: {
      type: Date,
      default: Date.now
    },
    reason: {
      type: String,
      required: true
    }
  }]
}, {
  timestamps: true
});

// Custom validation to ensure at least one contact method is provided
visitorSchema.pre('save', function(next) {
  if (!this.email && !this.phone) {
    const error = new Error('At least one contact method (phone or email) is required');
    return next(error);
  }
  next();
});

// Create and export the model
const VisitorNew = mongoose.models.VisitorNew || mongoose.model<IVisitorNew>('VisitorNew', visitorSchema);
export default VisitorNew;
