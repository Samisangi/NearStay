import FeaturedArea from '../models/FeaturedArea.js';

// GET /api/featured-areas  — public: only active areas, sorted by order
export const getActiveFeaturedAreas = async (req, res) => {
  try {
    const areas = await FeaturedArea.find({ isActive: true }).sort({ order: 1 });
    res.json({ success: true, data: areas });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// GET /api/featured-areas/all  — admin: all areas regardless of isActive
export const getAllFeaturedAreas = async (req, res) => {
  try {
    const areas = await FeaturedArea.find().sort({ order: 1 });
    res.json({ success: true, data: areas });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// POST /api/featured-areas  — admin: create a new featured area
export const createFeaturedArea = async (req, res) => {
  try {
    const { label, city, lat, lng, isActive, order } = req.body;
    const area = await FeaturedArea.create({ label, city, lat, lng, isActive, order });
    res.status(201).json({ success: true, data: area });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// PATCH /api/featured-areas/:id  — admin: update a featured area
export const updateFeaturedArea = async (req, res) => {
  try {
    const area = await FeaturedArea.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!area) return res.status(404).json({ success: false, message: 'Featured area not found' });
    res.json({ success: true, data: area });
  } catch (err) {
    res.status(400).json({ success: false, message: err.message });
  }
};

// DELETE /api/featured-areas/:id  — admin: delete a featured area
export const deleteFeaturedArea = async (req, res) => {
  try {
    const area = await FeaturedArea.findByIdAndDelete(req.params.id);
    if (!area) return res.status(404).json({ success: false, message: 'Featured area not found' });
    res.json({ success: true, message: 'Featured area deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};
