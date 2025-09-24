import mongoose, { Document, Schema } from 'mongoose';

export interface IFaq extends Document {
  question: string;
  answer: string;
  category?: string;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new Schema<IFaq>({
  question: {
    type: String,
    required: true,
    trim: true,
    maxlength: 400
  },
  answer: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000
  },
  category: {
    type: String,
    trim: true,
    maxlength: 120
  }
}, {
  timestamps: true
});

// Indexes
faqSchema.index({ createdAt: -1 });
faqSchema.index({ category: 1 });

// Create and export the model
const Faq = mongoose.models.Faq || mongoose.model<IFaq>('Faq', faqSchema);
export default Faq;
