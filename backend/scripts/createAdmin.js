/**
 * One-time script to create an admin user in the NearStay database.
 * Usage: node scripts/createAdmin.js
 */

import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../.env') });

import User from '../src/models/User.js';

const ADMIN = {
  name: 'Admin',
  email: 'admin@nearstay.com',
  password: 'Admin@1234',   // change this after first login!
  role: 'admin',
  isVerified: true,
};

async function main() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('✅ Connected to MongoDB');

  const existing = await User.findOne({ email: ADMIN.email });
  if (existing) {
    console.log(`⚠️  Admin already exists: ${ADMIN.email}`);
    process.exit(0);
  }

  const admin = new User(ADMIN);
  await admin.save();
  console.log(`🎉 Admin created!`);
  console.log(`   Email   : ${ADMIN.email}`);
  console.log(`   Password: ${ADMIN.password}`);
  console.log(`   ⚠️  Please change the password after first login.`);
  process.exit(0);
}

main().catch((err) => {
  console.error('❌ Error:', err.message);
  process.exit(1);
});
