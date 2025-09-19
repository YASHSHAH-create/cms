const mongoose = require('mongoose');

const VisitorSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      unique: true,
      sparse: true, // Allows multiple documents without email
      index: true,
      validate: v => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 24,
      unique: true,
      sparse: true, // Allows multiple documents without phone
      index: true,
      validate: v => !v || /^[0-9+\-()\s]{7,24}$/.test(v)
    },
    organization: { type: String, trim: true, maxlength: 300 },
    region: { type: String, trim: true, maxlength: 120 },
    service: { type: String, trim: true, maxlength: 500 },
    subservice: { type: String, trim: true, maxlength: 500 },
    source: { 
      type: String, 
      trim: true, 
      default: 'chatbot',
      enum: ['chatbot', 'email', 'calls', 'website']
    },
    location: { type: String, trim: true, maxlength: 200 },
    meta: { type: Object, default: {} },
    lastInteractionAt: { type: Date, default: Date.now },
    isConverted: { type: Boolean, default: false },
    status: { 
      type: String, 
      default: 'enquiry_required',
      enum: [
        'enquiry_required',
        'contact_initiated',
        'feasibility_check',
        'qualified',
        'quotation_sent',
        'negotiation_stage',
        'converted',
        'payment_received',
        'sample_received',
        'handed_to_smc',
        'informed_about_se',
        'provided_kyc_quotation_to_smc',
        'process_initiated',
        'ongoing_process',
        'report_generated',
        'sent_to_client_via_mail',
        'report_hardcopy_sent',
        'unqualified'
      ]
    },
    agent: { type: String, trim: true, maxlength: 120 },
    agentName: { type: String, trim: true, maxlength: 120 },
    // Pipeline tracking fields
    pipelineHistory: [{
      status: { type: String, required: true },
      changedAt: { type: Date, default: Date.now },
      changedBy: { type: String, trim: true },
      notes: { type: String, trim: true, maxlength: 500 }
    }],
    // Enquiry specific fields
    enquiryDetails: { type: String, trim: true, maxlength: 2000 },
    priority: { 
      type: String, 
      default: 'medium',
      enum: ['low', 'medium', 'high', 'urgent']
    },
    assignedAgent: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    salesExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    salesExecutiveName: { type: String, trim: true, maxlength: 120 },
    // Customer Executive Assignment (NEW)
    customerExecutive: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    customerExecutiveName: { type: String, trim: true, maxlength: 120 },
    estimatedValue: { type: Number, min: 0 },
    amount: { type: Number, min: 0 },
    comments: { type: String, trim: true, maxlength: 2000 },
    expectedCompletionDate: { type: Date },
    // Additional tracking
    leadScore: { type: Number, default: 0, min: 0, max: 100 },
    lastContactDate: { type: Date },
    nextFollowUpDate: { type: Date },
    // Version tracking for conflict resolution (NEW)
    version: { type: Number, default: 1 },
    lastModifiedBy: { type: String, trim: true, maxlength: 120 },
    lastModifiedAt: { type: Date, default: Date.now },
    // Assignment history tracking (NEW)
    assignmentHistory: [{
      executiveId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
      executiveName: { type: String, trim: true, maxlength: 120 },
      role: { type: String, enum: ['sales-executive', 'customer-executive'] },
      assignedAt: { type: Date, default: Date.now },
      assignedBy: { type: String, trim: true, maxlength: 120 },
      unassignedAt: { type: Date },
      reason: { type: String, trim: true, maxlength: 200 }
    }]
  },
  { timestamps: true }
);

VisitorSchema.index({ createdAt: -1 });
VisitorSchema.index({ status: 1 });
VisitorSchema.index({ source: 1 });
VisitorSchema.index({ assignedAgent: 1 });
VisitorSchema.index({ isConverted: 1 });
// NEW indexes for multi-executive system
VisitorSchema.index({ salesExecutive: 1 });
VisitorSchema.index({ customerExecutive: 1 });
VisitorSchema.index({ salesExecutiveName: 1 });
VisitorSchema.index({ customerExecutiveName: 1 });
VisitorSchema.index({ version: 1 });
// Compound index to ensure email and phone uniqueness
VisitorSchema.index({ email: 1, phone: 1 }, { unique: true, sparse: true });

// Define pipeline stages in order
const PIPELINE_STAGES_ORDER = [
  'enquiry_required',
  'contact_initiated', 
  'feasibility_check',
  'qualified',
  'quotation_sent',
  'negotiation_stage',
  'converted',
  'payment_received',
  'sample_received',
  'handed_to_smc',
  'informed_about_se',
  'provided_kyc_quotation_to_smc',
  'process_initiated',
  'ongoing_process',
  'report_generated',
  'sent_to_client_via_mail',
  'report_hardcopy_sent',
  'unqualified'
];

// Pre-save middleware to track pipeline changes - AUTO-FILL MISSING STAGES
VisitorSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    if (!this.pipelineHistory) {
      this.pipelineHistory = [];
    }
    
    const newStatus = this.status;
    const newStatusIndex = PIPELINE_STAGES_ORDER.indexOf(newStatus);
    
    if (newStatusIndex === -1) {
      console.log(`Unknown status: ${newStatus}, skipping auto-fill`);
      next();
      return;
    }
    
    // Get all stages that have been reached so far
    const reachedStages = new Set(this.pipelineHistory.map(entry => entry.status));
    
    // Add all missing stages from the beginning up to the new status
    for (let i = 0; i <= newStatusIndex; i++) {
      const stageToAdd = PIPELINE_STAGES_ORDER[i];
      
      if (!reachedStages.has(stageToAdd)) {
        // Add missing stage
        this.pipelineHistory.push({
          status: stageToAdd,
          changedAt: new Date(),
          changedBy: 'system',
          notes: stageToAdd === newStatus ? `Status changed to ${stageToAdd}` : `Auto-filled stage: ${stageToAdd}`
        });
        reachedStages.add(stageToAdd);
        console.log(`Auto-filled missing stage: ${stageToAdd}`);
      } else if (stageToAdd === newStatus) {
        // Update the existing entry for the current status
        const existingEntry = this.pipelineHistory.find(entry => entry.status === stageToAdd);
        if (existingEntry) {
          existingEntry.changedAt = new Date();
          // Only set default notes if no notes exist (preserve custom notes)
          if (!existingEntry.notes || existingEntry.notes === `Status changed to ${stageToAdd}` || existingEntry.notes === `Auto-filled stage: ${stageToAdd}`) {
            existingEntry.notes = `Status changed to ${stageToAdd}`;
          }
          console.log(`Updated existing pipeline history entry for status: ${stageToAdd}, notes: ${existingEntry.notes}`);
        }
      }
    }
  }
  next();
});

// Pre-save middleware for version tracking and conflict resolution (NEW)
VisitorSchema.pre('save', function(next) {
  if (this.isModified() && !this.isNew) {
    // Increment version on any modification (except new documents)
    this.version = (this.version || 1) + 1;
    this.lastModifiedAt = new Date();
    
    // Track assignment changes
    if (this.isModified('salesExecutive') || this.isModified('customerExecutive')) {
      if (!this.assignmentHistory) {
        this.assignmentHistory = [];
      }
      
      // Add assignment history entry
      if (this.isModified('salesExecutive') && this.salesExecutive) {
        this.assignmentHistory.push({
          executiveId: this.salesExecutive,
          executiveName: this.salesExecutiveName || 'Unknown',
          role: 'sales-executive',
          assignedAt: new Date(),
          assignedBy: this.lastModifiedBy || 'System'
        });
      }
      
      if (this.isModified('customerExecutive') && this.customerExecutive) {
        this.assignmentHistory.push({
          executiveId: this.customerExecutive,
          executiveName: this.customerExecutiveName || 'Unknown',
          role: 'customer-executive',
          assignedAt: new Date(),
          assignedBy: this.lastModifiedBy || 'System'
        });
      }
    }
  }
  next();
});

module.exports = mongoose.model('Visitor', VisitorSchema);
