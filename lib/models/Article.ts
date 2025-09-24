import mongoose, { Document, Schema } from 'mongoose';

export interface IArticle extends Document {
  title: string;
  content: string;
  author?: string;
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}

const articleSchema = new Schema<IArticle>({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 240
  },
  content: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100000
  },
  author: {
    type: String,
    trim: true,
    maxlength: 160
  },
  tags: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Indexes
articleSchema.index({ createdAt: -1 });
articleSchema.index({ title: 'text', content: 'text', tags: 1 });

// Create and export the model
const Article = mongoose.models.Article || mongoose.model<IArticle>('Article', articleSchema);
export default Article;
