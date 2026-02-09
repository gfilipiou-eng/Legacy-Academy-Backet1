import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            min: 3,
            max: 20,
            unique: true,
        },
        email: {
            type: String,
            required: true,
            max: 50,
            unique: true,
        },
        password: {
            type: String,
            required: true,
            min: 6,
        },
        profilePic: {
            type: String,
            default: "",
        },
        coverPic: {
            type: String,
            default: "",
        },
        followers: {
            type: Array, // Or: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
            default: [],
        },
        following: {
            type: Array,
            default: [],
        },
        isAdmin: {
            type: Boolean,
            default: false,
        },
        role: {
            type: String,
            enum: ['User', 'Admin', 'Founder'],
            default: 'User'
        },
        bio: {
            type: String,
            max: 150,
            default: "Entrepreneur. Legacy Member."
        },
        isPrivate: {
            type: Boolean,
            default: false
        },
        requests: {
            type: Array,
            default: []
        },
        notifications: [
            {
                type: { type: String, enum: ['like', 'comment', 'follow', 'system'] }, // Added system for consistency
                from: { type: String }, // User ID usually
                fromUsername: { type: String },
                fromProfilePic: { type: String },
                read: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now },
                post: { type: String } // Optional post ID for like/comments
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model("User", UserSchema);
