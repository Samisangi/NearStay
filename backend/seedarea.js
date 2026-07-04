// Run in backend terminal: node seed-areas.js
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import FeaturedArea from './src/models/FeaturedArea.js';

dotenv.config();
await mongoose.connect(process.env.MONGO_URI);

await FeaturedArea.insertMany([
  { label: 'Sukkur IBA University', city: 'Sukkur', lat: 27.72575, lng: 68.81913, order: 0 },
  { label: 'Gulberg', city: 'Lahore', lat: 31.5378, lng: 74.3477, order: 1 },
  { label: 'Johar Town', city: 'Lahore', lat: 31.4622, lng: 74.2942, order: 2 },
  { label: 'Lahore city centre', city: 'Lahore', lat: 31.5497, lng: 74.3436, order: 3 },
  { label: 'Sukkur city centre', city: 'Sukkur', lat: 27.7032, lng: 68.8589, order: 4 },
]);

console.log('Done');
process.exit(0);