import mongoose from "mongoose";

const MessageSchema = new mongoose.Schema({
    sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    recipient: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    text: { type: String },
    audioUrl: { type: String },
    read: { type: Boolean, default: false }
}, { timestamps: true });

const Message = mongoose.model("Message", MessageSchema);
export default Message;
