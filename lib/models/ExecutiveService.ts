import mongoose, { Document, Schema } from 'mongoose';

export interface IExecutiveService extends Document {
  executiveId: mongoose.Types.ObjectId;
  serviceName: string;
  assignedAt: Date;
  assignedBy: mongoose.Types.ObjectId;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const executiveServiceSchema = new Schema<IExecutiveService>({
  executiveId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  serviceName: {
    type: String,
    required: true,
    trim: true,
    maxlength: 120
  },
  assignedAt: {
    type: Date,
    default: Date.now
  },
  assignedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Compound index to ensure unique service assignment per executive
executiveServiceSchema.index({ executiveId: 1, serviceName: 1 }, { unique: true });

// Index for efficient querying
executiveServiceSchema.index({ serviceName: 1, isActive: 1 });

// Create and export the model
const ExecutiveService = mongoose.models.ExecutiveService || mongoose.model<IExecutiveService>('ExecutiveService', executiveServiceSchema);
export default ExecutiveService;
