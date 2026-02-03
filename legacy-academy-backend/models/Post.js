import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: String,
  desc: String,
  hashtags: [String],
  image: String,
  gif: String,

  // VIDEO SUPPORT
  videoUrl: String,        // Cloudinary video URL
  thumbnailUrl: String,    // Video thumbnail/poster
  videoDuration: Number,   // Duration in seconds (max 15 for highlights)

  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for populate
  username: String, // Denormalized for quick access (backup)
  profilePic: String, // Denormalized user profile pic
  role: String,   // User Role at creation

  // ENGAGEMENT
  likes: { type: Array, default: [] },      // IDs of users who liked
  dislikes: { type: Array, default: [] },   // IDs of users who disliked
  likesUsers: { type: Array, default: [] },
  comments: [{
    text: { type: String, required: true },
    authorName: String,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorProfilePic: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // PREMIUM FEATURES
  isBoosted: { type: Boolean, default: false },  // Paid boost
  boostExpiry: Date,  // When boost expires
  visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },

  // STORIES
  isStory: { type: Boolean, default: false },
  expiresAt: Date

}, { timestamps: true });

export default mongoose.model("Post", PostSchema);