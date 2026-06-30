import mongoose from 'mongoose';

const listingSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 120,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    rent: {
      type: Number,
      required: [true, 'Rent is required'],
      min: 0,
    },
    roomType: {
      type: String,
      enum: ['single', 'shared', 'apartment'],
      required: true,
    },
    ownerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },

    // GeoJSON Point. IMPORTANT: coordinates are [longitude, latitude],
    // the OPPOSITE order from Leaflet's [lat, lng]. Always convert at the
    // boundary (see utils/geoFormat.js) - never construct this array by hand
    // elsewhere in the codebase.
    location: {
      type: {
        type: String,
        enum: ['Point'],
        required: true,
        default: 'Point',
      },
      coordinates: {
        type: [Number], // [lng, lat]
        required: true,
        validate: {
          validator: (coords) =>
            Array.isArray(coords) &&
            coords.length === 2 &&
            coords[0] >= -180 &&
            coords[0] <= 180 && // longitude range
            coords[1] >= -90 &&
            coords[1] <= 90, // latitude range
          message: 'Invalid coordinates - expected [lng, lat] within valid ranges',
        },
      },
    },

    address: {
      type: String, // human-readable, for display only - not used in geo queries
      required: true,
    },

    amenities: {
      type: [String],
      enum: ['wifi', 'ac', 'attached_bath', 'furnished', 'parking', 'kitchen_access'],
      default: [],
    },

    photos: {
      type: [String], // Cloudinary URLs
      default: [],
    },
    coverPhoto: {
      type: String,
      default: '',
    },

    status: {
      type: String,
      enum: ['active', 'rented', 'inactive'],
      default: 'active',
    },

    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    reviewCount: {
      type: Number,
      default: 0,
    },
    inquiryCount: {
      type: Number,
      default: 0,
    },
  },
  { timestamps: true }
);

// The critical index for proximity search. Without this, $geoNear in the
// search aggregation will throw an error - it REQUIRES a 2dsphere index
// to exist on the field it's querying.
listingSchema.index({ location: '2dsphere' });

// Helpful secondary indexes for common filter/sort combinations
listingSchema.index({ status: 1, rent: 1 });
listingSchema.index({ ownerId: 1 });

const Listing = mongoose.model('Listing', listingSchema);

export default Listing;
