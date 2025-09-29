import mongoose from "mongoose";

const EnquirySchema = new mongoose.Schema(
  {
    visitorId: { type: mongoose.Schema.Types.ObjectId, ref: "Visitor" },
    service: String,
    channel: String, // e.g., "chatbot"
    status: { type: String, default: "new" }, // new|open|pending|assigned|converted|won|closed_won|lead
  },
  { timestamps: true, collection: "enquiries" }
);

export default mongoose.models.Enquiry ?? mongoose.model("Enquiry", EnquirySchema);