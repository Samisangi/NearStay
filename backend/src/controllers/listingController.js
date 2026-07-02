import asyncHandler from 'express-async-handler';
import Listing from '../models/Listing.js';
import {
  uploadBufferToCloudinary,
  deleteFromCloudinary,
} from '../middleware/upload.js';
import { geocodeAddress } from '../utils/geocode.js';

export const createListing = asyncHandler(async (req, res) => {
  const { title, description, rent, roomType, amenities, address, lat, lng } = req.body;

  let coordinates;
  if (lat && lng) {
    coordinates = [parseFloat(lng), parseFloat(lat)];
  } else if (address) {
    coordinates = await geocodeAddress(address);
  } else {
    res.status(400);
    throw new Error('Provide lat/lng or an address');
  }

  let photoUrls = [];
  if (req.files?.length) {
    photoUrls = await Promise.all(
      req.files.map((f) => uploadBufferToCloudinary(f.buffer, 'nearstay/listings'))
    );
  }

  const amenitiesArr = Array.isArray(amenities)
    ? amenities
    : amenities
    ? amenities.split(',').map((a) => a.trim())
    : [];

  const listing = await Listing.create({
    title,
    description,
    rent: parseFloat(rent),
    roomType,
    ownerId: req.user._id,
    location: { type: 'Point', coordinates },
    address,
    amenities: amenitiesArr,
    photos: photoUrls,
    coverPhoto: photoUrls[0] || '',
  });

  res.status(201).json({ success: true, listing });
});

export const getListingById = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id).populate(
    'ownerId',
    'name profilePicture phone'
  );
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }
  res.json({ success: true, listing });
});

export const updateListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }
  if (listing.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not own this listing');
  }

  const fields = ['title', 'description', 'rent', 'roomType', 'status', 'address'];
  fields.forEach((f) => {
    if (req.body[f] !== undefined) listing[f] = req.body[f];
  });

  if (req.body.amenities) {
    listing.amenities = Array.isArray(req.body.amenities)
      ? req.body.amenities
      : req.body.amenities.split(',').map((a) => a.trim());
  }

  if (req.body.lat && req.body.lng) {
    listing.location = {
      type: 'Point',
      coordinates: [parseFloat(req.body.lng), parseFloat(req.body.lat)],
    };
  }

  // Handle photo deletions (pass array of URLs to remove)
  if (req.body.removePhotos) {
    const toRemove = Array.isArray(req.body.removePhotos)
      ? req.body.removePhotos
      : [req.body.removePhotos];
    await Promise.all(toRemove.map((url) => deleteFromCloudinary(url)));
    listing.photos = listing.photos.filter((p) => !toRemove.includes(p));
  }

  // Upload new photos and append
  if (req.files?.length) {
    const newUrls = await Promise.all(
      req.files.map((f) => uploadBufferToCloudinary(f.buffer, 'nearstay/listings'))
    );
    listing.photos = [...listing.photos, ...newUrls];
  }

  // Update cover photo
  if (req.body.coverPhoto) {
    listing.coverPhoto = req.body.coverPhoto;
  } else if (!listing.coverPhoto && listing.photos.length) {
    listing.coverPhoto = listing.photos[0];
  }

  await listing.save();
  res.json({ success: true, listing });
});

export const deleteListing = asyncHandler(async (req, res) => {
  const listing = await Listing.findById(req.params.id);
  if (!listing) {
    res.status(404);
    throw new Error('Listing not found');
  }
  if (listing.ownerId.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error('You do not own this listing');
  }

  // Delete all photos from Cloudinary
  await Promise.all(listing.photos.map((url) => deleteFromCloudinary(url)));
  await listing.deleteOne();
  res.json({ success: true, message: 'Listing deleted' });
});

export const getMyListings = asyncHandler(async (req, res) => {
  const listings = await Listing.find({ ownerId: req.user._id }).sort({ createdAt: -1 });
  res.json({ success: true, listings });
});