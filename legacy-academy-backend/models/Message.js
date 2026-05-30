import mongoose from "mongoose";

export const MESSAGE_TTL_MS = 24 * 60 * 60 * 1000;

export const getMessageExpiresAt = (baseDate = new Date()) =>
    new Date(new Date(baseDate).getTime() + MESSAGE_TTL_MS);

const MessageSchema = new mongoose.Schema(
    {
        sender: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        recipient: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        text: {
            type: String,
            default: "",
        },
        audio: {
            type: String, // URL for audio
            default: "",
        },
        image: {
            type: String, // URL for image attachment
            default: "",
        },
        isLocked: {
            type: Boolean,
            default: false,
        },
        isRead: {
            type: Boolean,
            default: false,
        },
        readAt: {
            type: Date,
            default: null,
        },
        expiresAt: {
            type: Date,
            default: () => getMessageExpiresAt(),
        },
    },
    { timestamps: true }
);

MessageSchema.pre("validate", function syncExpiry() {
    if (this.isLocked) {
        this.expiresAt = null;
        return;
    }

    const baseDate = this.createdAt instanceof Date ? this.createdAt : new Date();
    this.expiresAt = getMessageExpiresAt(baseDate);
});

MessageSchema.index(
    { expiresAt: 1 },
    {
        expireAfterSeconds: 0,
        partialFilterExpression: {
            isLocked: { $ne: true },
            expiresAt: { $type: "date" },
        },
    }
);

export default mongoose.model("Message", MessageSchema);
