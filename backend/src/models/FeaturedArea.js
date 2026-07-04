import mongoose from 'mongoose';

const featuredAreaSchema = new mongoose.Schema(
  {
    label: { type: String, required: true, trim: true },
    city: { type: String, required: true, trim: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    isActive: { type: Boolean, default: true },
    order: { type: Number, default: 0 },
  },
  { timestamps: true }
);

export default mongoose.model('FeaturedArea', featuredAreaSchema);