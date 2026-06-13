import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "User" },
  profilePic: { type: String, default: "" },
  bio: { type: String, default: "" },
  profileDescriptor: {
    type: String,
    default: ""
  },
  founderAffiliation: {
    type: String,
    default: ""
  },
  lastUsernameChange: { type: Date },
  lastSeen: { type: Date, default: Date.now },
  lastActive: { type: Date, default: Date.now },
  banExpires: { type: Date },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: "" },

  // Follow System
  followers: { type: Array, default: [] },  // User IDs who follow this user
  following: { type: Array, default: [] },  // User IDs this user follows
  followRequests: { type: Array, default: [] }, // Pending follower requests for private accounts

  // Password Reset
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },

  // Settings & Privacy
  isPrivate: { type: Boolean, default: false },
  isFollowersOnly: { type: Boolean, default: false },
  settings: {
    theme: { type: String, default: 'purple' },
    language: { type: String, default: 'en' },
    soundEnabled: { type: Boolean, default: true },
    notifications: { type: Boolean, default: true },
    dmFollowersOnly: { type: Boolean, default: false },
    showProfileShareButton: { type: Boolean, default: true },
    showBadge: { type: Boolean, default: false },
    badgeColor: { type: String, default: 'blue' },
    blur18Plus: { type: Boolean, default: false }
  },
  missionsStreak: { type: Number, default: 0 },
  lastMissionCompleted: { type: Date },
  missionsCompletedCount: { type: Number, default: 0 },

  // Notifications
  notifications: [{
    type: { type: String, enum: ['follow', 'comment', 'like', 'mention', 'message', 'follow_request', 'follow_accepted'], required: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    fromUsername: { type: String },
    fromProfilePic: { type: String },
    fromRole: { type: String },
    fromDescriptor: { type: String },
    post: { type: mongoose.Schema.Types.ObjectId, ref: 'Post' },
    text: { type: String },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }]

}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
export default User;
