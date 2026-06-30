import mongoose from 'mongoose';

const inquirySchema = new mongoose.Schema(
  { listingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Listing', required: true },
    seekerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    message: { type: String, required: true },
    status: { type: String, enum: ['pending', 'responded', 'closed'], default: 'pending' } },
  { timestamps: true }
);

export default mongoose.model('Inquiry', inquirySchema);