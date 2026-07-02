import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema(
  {
    inquiryId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Inquiry',
      required: true,
    },
    senderId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    text: {
      type: String,
      required: true,
      trim: true,
    },
    readBy: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
      },
    ],
  },
  { timestamps: true }
);

messageSchema.index({ inquiryId: 1, createdAt: 1 });

export default mongoose.model('Message', messageSchema);