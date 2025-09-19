const mongoose = require('mongoose');

const FaqSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, trim: true, maxlength: 400 },
    answer: { type: String, required: true, trim: true, maxlength: 4000 },
    category: { type: String, trim: true, maxlength: 120 }
  },
  { timestamps: true }
);

FaqSchema.index({ createdAt: -1 });
FaqSchema.index({ category: 1 });
module.exports = mongoose.model('Faq', FaqSchema);
