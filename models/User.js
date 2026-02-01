import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: "User" },
  profilePic: { type: String, default: "" },
  bio: { type: String, default: "" },

  // Follow System
  followers: { type: Array, default: [] },  // User IDs who follow this user
  following: { type: Array, default: [] },  // User IDs this user follows

  // Password Reset
  resetToken: { type: String },
  resetTokenExpiry: { type: Date },

}, { timestamps: true });

const User = mongoose.model("User", UserSchema);
export default User;
