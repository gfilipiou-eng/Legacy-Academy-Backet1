import mongoose from "mongoose";

const CartelSchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String, default: "" },
  image: { type: String, default: "" },
  coverImage: { type: String, default: "" },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  isPrivate: { type: Boolean, default: false },
  pin: { type: String, default: "" } // Allows for private vs public cartels in the future
}, { timestamps: true });

export default mongoose.model("Cartel", CartelSchema);
