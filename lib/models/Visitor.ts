import mongoose from "mongoose";

const VisitorSchema = new mongoose.Schema(
  {
    // Basic Info
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: String,
    organization: String,
    region: String,
    
    // Service Info
    service: { type: String, default: 'General Inquiry' },
    subservice: String,
    enquiryDetails: String,
    
    // Source & Status
    source: { type: String, default: 'chatbot' }, // chatbot, email, calls, website
    status: { type: String, default: 'enquiry_required' },
    
    // Assignment Fields
    agent: String,
    agentName: String,
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    
    salesExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    salesExecutiveName: String,
    
    customerExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerExecutiveName: String,
    
    // Additional Fields
    comments: String,
    amount: { type: Number, default: 0 },
    isConverted: { type: Boolean, default: false },
    
    // Tracking
    lastInteractionAt: Date,
    lastModifiedBy: String,
    lastModifiedAt: Date,
    
    // History & Meta
    pipelineHistory: [
      {
        status: String,
        changedAt: Date,
        changedBy: String,
        notes: String
      }
    ],
    assignmentHistory: [
      {
        assignedBy: String,
        assignedTo: String,
        assignedAt: Date,
        reason: String
      }
    ],
    
    // Version control
    version: { type: Number, default: 1 },
    
    // Metadata
    location: String,
    meta: mongoose.Schema.Types.Mixed,
    leadScore: Number,
    priority: String
  },
  { 
    timestamps: true, 
    collection: "visitors",
    strict: false // Allow flexible schema for backward compatibility
  }
);

// Indexes for performance
VisitorSchema.index({ email: 1 });
VisitorSchema.index({ phone: 1 });
VisitorSchema.index({ status: 1 });
VisitorSchema.index({ assignedAgent: 1 });
VisitorSchema.index({ salesExecutive: 1 });
VisitorSchema.index({ createdAt: -1 });

export default mongoose.models.Visitor ?? mongoose.model("Visitor", VisitorSchema);