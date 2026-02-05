import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  user: String,
  text: String,
  image: String,
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("Post", PostSchema);
