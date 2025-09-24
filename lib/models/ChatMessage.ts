import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage extends Document {
  visitorId: mongoose.Types.ObjectId;
  sender: 'user' | 'bot';
  message: string;
  at: Date;
  createdAt: Date;
  updatedAt: Date;
}

const chatMessageSchema = new Schema<IChatMessage>({
  visitorId: {
    type: Schema.Types.ObjectId,
    ref: 'Visitor',
    required: true,
    index: true
  },
  sender: {
    type: String,
    enum: ['user', 'bot'],
    required: true
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 4000
  },
  at: {
    type: Date,
    default: Date.now,
    index: true
  }
}, {
  timestamps: true
});

// Create and export the model
const ChatMessage = mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', chatMessageSchema);
export default ChatMessage;
