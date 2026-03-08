import mongoose from "mongoose";

const PostSchema = new mongoose.Schema({
  title: String,
  desc: String,
  hashtags: [String],
  image: String,
  gif: String,

  // AUDIO SUPPORT
  audioUrl: String,

  // VIDEO SUPPORT
  videoUrl: String,        // Cloudinary video URL
  thumbnailUrl: String,    // Video thumbnail/poster
  videoDuration: Number,   // Duration in seconds (max 15 for highlights)

  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Reference to User for populate
  username: String, // Denormalized for quick access (backup)
  profilePic: String, // Denormalized user profile pic
  role: String,   // User Role at creation

  // ENGAGEMENT
  likes: { type: Array, default: [] },
  dislikes: { type: Array, default: [] },
  reposts: { type: Array, default: [] },
  shares: { type: Array, default: [] },
  likesUsers: { type: Array, default: [] },
  comments: [{
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    text: { type: String, required: false }, // Text optional if audio present
    audioUrl: String, // Audio comment support
    authorName: String,
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    authorProfilePic: String,
    createdAt: { type: Date, default: Date.now }
  }],

  // PREMIUM FEATURES
  isBoosted: { type: Boolean, default: false },  // Paid boost
  boostExpiry: Date,  // When boost expires
  visibility: { type: String, enum: ['public', 'followers', 'private'], default: 'public' },
  isPrivate: { type: Boolean, default: false }, // Denormalized for quick feed filtering
  isFollowersOnly: { type: Boolean, default: false }, // Denormalized for quick feed filtering
  isStory: { type: Boolean, default: false }, // Temporary intelligence (Highlights)
  isFlagged: { type: Boolean, default: false }, // Flagged by Nova for review
  flagReason: { type: String, default: "" }    // Reason for flagging (e.g. 'NSFW', 'Spam')

}, { timestamps: true });

export default mongoose.model("Post", PostSchema);
