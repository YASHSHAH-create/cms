const mongoose = require('mongoose');

const ExecutiveServiceSchema = new mongoose.Schema(
  {
    executiveId: {
      type: mongoose.Schema.Types.ObjectId,
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
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Compound index to ensure unique service assignment per executive
ExecutiveServiceSchema.index({ executiveId: 1, serviceName: 1 }, { unique: true });

// Index for efficient querying
ExecutiveServiceSchema.index({ serviceName: 1, isActive: 1 });

module.exports = mongoose.model('ExecutiveService', ExecutiveServiceSchema);
