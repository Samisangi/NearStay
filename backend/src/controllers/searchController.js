import asyncHandler from 'express-async-handler';
import Listing from '../models/Listing.js';
import { geocodeAddress } from '../utils/geocode.js';

/**
 * GET /api/listings/search
 *
 * Query params:
 *   lat, lng          – center point (decimal degrees). If omitted, address is geocoded.
 *   address           – human-readable address to geocode when lat/lng are missing.
 *   radius            – search radius in kilometres (default: 5)
 *   roomType          – 'single' | 'shared' | 'apartment'  (optional)
 *   minRent           – minimum rent (optional)
 *   maxRent           – maximum rent (optional)
 *   amenities         – comma-separated list, e.g. "wifi,ac" (optional)
 *   status            – 'active' | 'rented' | 'inactive' (default: 'active')
 *   sort              – 'distance' | 'rent_asc' | 'rent_desc' | 'rating' (default: 'distance')
 *   page              – page number (default: 1)
 *   limit             – results per page (default: 20, max: 100)
 */
export const searchListings = asyncHandler(async (req, res) => {
  let {
    lat,
    lng,
    address,
    radius = 5,
    roomType,
    minRent,
    maxRent,
    amenities,
    status = 'active',
    sort = 'distance',
    page = 1,
    limit = 20,
  } = req.query;

  // ── 1. Resolve coordinates ────────────────────────────────────────────────
  let coordinates; // [lng, lat] in GeoJSON order

  if (lat && lng) {
    coordinates = [parseFloat(lng), parseFloat(lat)];
  } else if (address) {
    coordinates = await geocodeAddress(address);
  } else {
    // No location provided – return unfiltered listings (useful for browsing)
    coordinates = null;
  }

  // ── 2. Build match filter ─────────────────────────────────────────────────
  const match = {};

  if (status) match.status = status;
  if (roomType) match.roomType = roomType;

  if (minRent !== undefined || maxRent !== undefined) {
    match.rent = {};
    if (minRent !== undefined) match.rent.$gte = parseFloat(minRent);
    if (maxRent !== undefined) match.rent.$lte = parseFloat(maxRent);
  }

  if (amenities) {
    const amenityList = amenities.split(',').map((a) => a.trim()).filter(Boolean);
    if (amenityList.length) match.amenities = { $all: amenityList };
  }

  // ── 3. Pagination ─────────────────────────────────────────────────────────
  page = Math.max(1, parseInt(page, 10));
  limit = Math.min(100, Math.max(1, parseInt(limit, 10)));
  const skip = (page - 1) * limit;

  // ── 4. Build aggregation pipeline ────────────────────────────────────────
  let pipeline = [];

  const radiusMetres = parseFloat(radius) * 1000;

  if (coordinates) {
    // $geoNear MUST be the first stage and requires the 2dsphere index
    pipeline.push({
      $geoNear: {
        near: { type: 'Point', coordinates },
        distanceField: 'distance', // metres
        maxDistance: radiusMetres,
        spherical: true,
        query: match,
      },
    });
  } else {
    pipeline.push({ $match: match });
  }

  // ── 5. Sort ───────────────────────────────────────────────────────────────
  const sortStage = {};
  switch (sort) {
    case 'rent_asc':
      sortStage.rent = 1;
      break;
    case 'rent_desc':
      sortStage.rent = -1;
      break;
    case 'rating':
      sortStage.averageRating = -1;
      break;
    case 'distance':
    default:
      if (coordinates) sortStage.distance = 1;
      else sortStage.createdAt = -1;
  }
  // Guard: never push an empty $sort — MongoDB rejects it
  if (Object.keys(sortStage).length > 0) {
    pipeline.push({ $sort: sortStage });
  } else {
    pipeline.push({ $sort: { createdAt: -1 } });
  }

  // ── 6. Count total (before pagination) ────────────────────────────────────
  const countPipeline = [...pipeline, { $count: 'total' }];

  // ── 7. Apply pagination ───────────────────────────────────────────────────
  pipeline.push({ $skip: skip });
  pipeline.push({ $limit: limit });

  // ── 8. Populate owner info ────────────────────────────────────────────────
  pipeline.push({
    $lookup: {
      from: 'users',
      localField: 'ownerId',
      foreignField: '_id',
      as: 'owner',
    },
  });
  // preserveNullAndEmptyArrays keeps listings that have no matching owner
  pipeline.push({ $unwind: { path: '$owner', preserveNullAndEmptyArrays: true } });
  // Only expose safe owner fields to the frontend
  pipeline.push({
    $addFields: {
      owner: {
        _id: '$owner._id',
        name: '$owner.name',
        profilePicture: '$owner.profilePicture',
        phone: '$owner.phone',
      },
    },
  });

  // ── 9. Execute ────────────────────────────────────────────────────────────
  const [listings, countResult] = await Promise.all([
    Listing.aggregate(pipeline),
    Listing.aggregate(countPipeline),
  ]);

  const total = countResult[0]?.total ?? 0;

  res.json({
    success: true,
    total,
    page,
    pages: Math.ceil(total / limit),
    listings,
  });
});
