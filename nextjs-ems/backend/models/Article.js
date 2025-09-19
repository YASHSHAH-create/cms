const mongoose = require('mongoose');

const ArticleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 240 },
    content: { type: String, required: true, trim: true, maxlength: 100000 },
    author: { type: String, trim: true, maxlength: 160 },
    tags: { type: [String], default: [] }
  },
  { timestamps: true }
);

ArticleSchema.index({ createdAt: -1 });
ArticleSchema.index({ title: 'text', content: 'text', tags: 1 });
module.exports = mongoose.model('Article', ArticleSchema);
