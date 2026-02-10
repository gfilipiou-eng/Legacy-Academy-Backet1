import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    audioUrl: { type: String },
    read: { type: Boolean, default: false },
    readAt: { type: Date, default: null }  // For Whispers auto-delete
}, { timestamps: true });

MessageSchema.index({ readAt: 1 });

const Message = mongoose.model("Message", MessageSchema);
export default Message;
