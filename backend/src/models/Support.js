import mongoose from 'mongoose';

const supportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    subject: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      enum: ['complaint', 'bug', 'billing', 'listing_issue', 'account', 'other'],
      default: 'other',
    },
    message: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['open', 'in_review', 'resolved', 'closed'],
      default: 'open',
    },
    priority: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium',
    },
    adminReply: {
      type: String,
      default: '',
    },
    adminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    repliedAt: Date,
    // Reference to a listing if complaint is about a specific listing
    relatedListingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Listing',
    },
  },
  { timestamps: true }
);

supportSchema.index({ userId: 1, createdAt: -1 });
supportSchema.index({ status: 1, priority: -1 });

export default mongoose.model('Support', supportSchema);