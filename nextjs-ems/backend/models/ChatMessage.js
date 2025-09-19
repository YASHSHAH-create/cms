const mongoose = require('mongoose');

const ChatMessageSchema = new mongoose.Schema(
  {
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Visitor', required: true, index: true },
    sender: { type: String, enum: ['user', 'bot'], required: true },
    message: { type: String, required: true, trim: true, maxlength: 4000 },
    at: { type: Date, default: Date.now, index: true }
  },
  { timestamps: true }
);

module.exports = mongoose.model('ChatMessage', ChatMessageSchema);
