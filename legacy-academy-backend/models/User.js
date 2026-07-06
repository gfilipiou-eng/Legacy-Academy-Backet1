import mongoose from "mongoose";

// Helper to clean up duplicate IDs in array
const cleanIdArray = (arr) => {
    const seen = new Set();
    return (arr || []).filter(id => {
        const strId = String(id);
        if (seen.has(strId)) return false;
        seen.add(strId);
        return true;
    });
};

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
            blur18Plus: { type: Boolean, default: true },
            is18PlusProfile: { type: Boolean, default: false },
            batterySaver: { type: Boolean, default: true },
            liquidGlassIntensity: { type: Number, default: 1.0 },
            cyberSFX: { type: Boolean, default: true },
            neuralNarrator: { type: Boolean, default: false },
            businessWebsites: { type: Array, default: [] },
            footballTeam: { type: Object, default: null },
            enableProfileZoom: { type: Boolean, default: false }
        },
        sharesBalance: {
            type: Number,
            default: 0
        },
        totalDeposited: {
            type: Number,
            default: 0
        },
        transactionHistory: {
            type: [
                {
                    type: { type: String },
                    amountUSD: { type: Number },
                    shares: { type: Number },
                    price: { type: Number },
                    createdAt: { type: Date, default: Date.now }
                }
            ],
            default: []
        },
        subscriptionEndDate: {
            type: Date,
            default: () => new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
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
        ],
        pushSubscriptions: [
            {
                endpoint: { type: String, required: true },
                expirationTime: { type: Date, default: null },
                keys: {
                    p256dh: { type: String, required: true },
                    auth: { type: String, required: true }
                }
            }
        ]
    },
    { timestamps: true }
);

UserSchema.pre('save', function() {
    if (this.isModified('followers')) {
        this.followers = cleanIdArray(this.followers);
    }
    if (this.isModified('following')) {
        this.following = cleanIdArray(this.following);
    }
    if (this.isModified('followRequests')) {
        this.followRequests = cleanIdArray(this.followRequests);
    }
});

export default mongoose.model("User", UserSchema);
