import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: String,
  desc: String,
  hashtags: [String],
  image: String,
  gif: String,
  author: String, // User ID
  role: String,   // User Role at creation
  likes: { type: Array, default: [] },      // IDs of users who liked
  likesUsers: { type: Array, default: [] }, // Duplicate array as requested? keeping 'likes' as main source usually better but adding both to match request.
  comments: [{
    _id: String,
    text: String,
    username: String,
    author: String
  }]
}, { timestamps: true });

export default mongoose.model("Post", PostSchema);