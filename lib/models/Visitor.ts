import mongoose from "mongoose";

const VisitorSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    source: String, // e.g., "chatbot", "landing-page"
  },
  { timestamps: true, collection: "visitors" }
);

export default mongoose.models.Visitor ?? mongoose.model("Visitor", VisitorSchema);