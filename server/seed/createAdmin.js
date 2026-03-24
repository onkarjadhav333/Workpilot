/**
 * ─── Admin Seed Script ────────────────────────────────────
 * Run once on a fresh database to create the first admin.
 * 
 * Usage:
 *   cd server
 *   node seed/createAdmin.js
 * 
 * Reads credentials from .env:
 *   ADMIN_NAME=Your Name
 *   ADMIN_EMAIL=admin@yourcompany.com
 *   ADMIN_PASSWORD=yourpassword
 */

require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const createAdmin = async () => {
  try {
    // ─── Step 1: Connect to MongoDB ───────────────────────
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // ─── Step 2: Check if admin already exists ────────────
    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log(`Admin already exists: ${existingAdmin.email}`);
      console.log('No changes made. Exiting.');
      process.exit(0);
    }

    // ─── Step 3: Read credentials from .env ───────────────
    const { ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD } = process.env;

    if (!ADMIN_NAME || !ADMIN_EMAIL || !ADMIN_PASSWORD) {
      console.error('Missing credentials in .env');
      console.error('Please add ADMIN_NAME, ADMIN_EMAIL, ADMIN_PASSWORD to your .env file');
      process.exit(1);
    }

    // ─── Step 4: Check email not already taken ────────────
    const emailTaken = await User.findOne({ email: ADMIN_EMAIL });
    if (emailTaken) {
      console.error(`Email ${ADMIN_EMAIL} is already registered as an employee.`);
      console.error('Use a different email or promote that user via the app.');
      process.exit(1);
    }

    // ─── Step 5: Hash password ────────────────────────────
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, salt);

    // ─── Step 6: Create admin ─────────────────────────────
    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL,
      password: hashedPassword,
      role: 'admin',
      isVerified: true  // admin doesn't need email verification
    });

    console.log('');
    console.log('Admin created successfully!');
    console.log(`   Name:  ${admin.name}`);
    console.log(`   Email: ${admin.email}`);
    console.log(`   Role:  ${admin.role}`);
    console.log('');
    console.log('You can now log in with these credentials.');
    process.exit(0);

  } catch (err) {
    console.error(' Error creating admin:', err.message);
    process.exit(1);
  }
};

createAdmin();