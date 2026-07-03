import mongoose from 'mongoose';

const BubbleSchema = new mongoose.Schema({
  text: {
    type: String,
    required: true,
    maxlength: 100
  },
  creator: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // The document will be automatically removed after 24 hours (86400 seconds)
  }
});

export default mongoose.model('Bubble', BubbleSchema);
