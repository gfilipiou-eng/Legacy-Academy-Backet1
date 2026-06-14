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
            max: 500,
            default: "Entrepreneur. Legacy Member."
        },
        profileDescriptor: {
            type: String,
            default: ''
        },
        founderAffiliation: {
            type: String,
            default: ''
        },
        lastSeen: {
            type: Date,
            default: Date.now
        },
        missionsStreak: { type: Number, default: 0 },
        lastMissionCompleted: { type: Date },
        missionsCompletedCount: { type: Number, default: 0 },
        isPrivate: {
            type: Boolean,
            default: false
        },
        isFollowersOnly: {
            type: Boolean,
            default: false
        },
        followRequests: {
            type: Array, // Array of User IDs
            default: []
        },
        isBot: {
            type: Boolean,
            default: false
        },
        settings: {
            theme: { type: String, default: '#ffd700' },
            language: { type: String, default: 'en' },
            background: { type: String, default: 'dark-blue' },
            dmFollowersOnly: { type: Boolean, default: false },
            displayMode: { type: String, default: 'dark' },
            zoom: { type: Number, default: 1 },
            showProfileShareButton: { type: Boolean, default: true },
            showBadge: { type: Boolean, default: true },
            badgeColor: { type: String, default: 'blue' },
            blur18Plus: { type: Boolean, default: false }
        },
        subscriptionEndDate: {
            type: Date,
            default: null
        },
        notifications: [
            {
                type: { type: String, enum: ['like', 'comment', 'follow', 'follow_request', 'follow_accepted', 'message', 'system', 'security_alert'] },
                from: { type: String },
                fromUsername: { type: String },
                fromProfilePic: { type: String },
                fromRole: { type: String },
                fromDescriptor: { type: String },
                read: { type: Boolean, default: false },
                createdAt: { type: Date, default: Date.now },
                post: { type: String }
            }
        ]
    },
    { timestamps: true }
);

export default mongoose.model("User", UserSchema);
