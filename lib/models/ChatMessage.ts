import mongoose from "mongoose";

const ChatMessageSchema = new mongoose.Schema(
  {
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor" },
    sessionId: String,
    sender: String, // "user" | "bot" | "agent"
    text: String,
  },
  { timestamps: true, collection: "chatmessages" }
);

export default mongoose.models.ChatMessage ?? mongoose.model("ChatMessage", ChatMessageSchema);