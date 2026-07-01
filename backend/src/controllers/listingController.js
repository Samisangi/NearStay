import asyncHandler from 'express-async-handler';
import Listing from '../models/Listing.js';
import { uploadToCloudinary } from '../middleware/upload.js';

// POST /api/listings
export const createListing = asyncHandler(async (req, res) => {
  const { title, description, rent, roomType, address, lat, lng, amenities } = req.body;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('Location coordinates (lat, lng) are required');
  }

  // Parse amenities — FormData sends repeated fields as array OR single string
  const parsedAmenities = Array.isArray(amenities)
    ? amenities
    : amenities
    ? [amenities]
    : [];

  // Upload photos to Cloudinary if provided
  let photoUrls = [];
  if (req.files && req.files.length > 0) {
    photoUrls = await Promise.all(
      req.files.map((f) => uploadToCloudinary(f.buffer))
    );
  }

  const listing = await Listing.create({
    title,
    description,
    rent: Number(rent),
    roomType,
    address,
    ownerId: req.user._id,
    location: {
      type: 'Point',
      coordinates: [parseFloat(lng), parseFloat(lat)], // GeoJSON: [lng, lat]
    },
    amenities: parsedAmenities,
    photos: photoUrls,
    coverPhoto: photoUrls[0] || '',
  });

  res.status(201).json({ success: true, listing });
});

// GET /api/listings/search?lat=&lng=&maxDistance=&maxRent=&roomType=&amenities=
// Uses $geoNear aggregation for proximity search — requires 2dsphere index (see Listing model).
export const searchListings = asyncHandler(async (req, res) => {
  const {
    lat,
    lng,
    maxDistance = 5000, // metres, default 5 km
    maxRent,
    roomType,
    amenities,
  } = req.query;

  if (!lat || !lng) {
    res.status(400);
    throw new Error('lat and lng query params are required');
  }

  const matchStage = { status: 'active' };
  if (maxRent) matchStage.rent = { $lte: Number(maxRent) };
  if (roomType) matchStage.roomType = roomType;
  if (amenities) {
    const amenityList = Array.isArray(amenities) ? amenities : [amenities];
    matchStage.amenities = { $all: amenityList };
  }

  const pipeline = [
    {
      $geoNear: {
        near: { type: 'Point', coordinates: [parseFloat(lng), parseFloat(lat)] },
        distanceField: 'distance', // metres from the search point
        maxDistance: Number(maxDistance),
        spherical: true,
        query: matchStage,
      },
    },
    {
      $lookup: {
        from: 'users',
        localField: 'ownerId',
        foreignField: '_id',
        as: 'owner',
        pipeline: [{ $project: { name: 1, phone: 1 } }],
      },
    },
    { $unwind: { path: '$owner', preserveNullAndEmpty: true } },
    { $limit: 50 },
  ];

  const listings = await Listing.aggregate(pipeline);
  res.json({ success: true, listings });
});

// GET /api/listings/owner/mine — owner's own listings
export const getOwnerListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, listings });
});

// GET /api/listings/:id
export const getListingById = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate('ownerId', 'name phone');
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }
  // Normalise: expose populated owner as `owner` field for convenience
  const obj = listing.toObject();
  obj.owner = obj.ownerId;
  res.json({ success: true, listing: obj });
});

// PATCH /api/listings/:id — owner only, checked in route
export const updateListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }
  if (listing.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised to edit this listing');
  }

  const fields = ['title', 'description', 'rent', 'roomType', 'address', 'status', 'amenities'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) listing[f] = req.body[f];
  });

  if (req.body.lat && req.body.lng) {
    listing.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    };
  }

  // Handle new photo uploads if any
  if (req.files && req.files.length > 0) {
    const newUrls = await Promise.all(req.files.map((f) => uploadToCloudinary(f.buffer)));
    listing.photos = [...listing.photos, ...newUrls];
    if (!listing.coverPhoto) listing.coverPhoto = newUrls[0];
  }

  await listing.save();
  res.json({ success: true, listing });
});

// DELETE /api/listings/:id — owner only
export const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }
  if (listing.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('Not authorised to delete this listing');
  }
  await listing.deleteOne();
  res.json({ success: true, message: 'Listing deleted' });
});
