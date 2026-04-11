const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const Doctor = require('./api/models/Doctor');
require('dotenv').config();

const seedAdmin = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    console.log('Connected to MongoDB');

    const email = "stephismily@gmail.com";
    const existingAdmin = await Doctor.findOne({ email });

    if (existingAdmin) {
      console.log('Admin user with this email already exists.');
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash("stephihackathon", 10);
    const admin = new Doctor({
      doctorName: 'System Admin',
      specialization: 'Administration',
      contact: '0000000000',
      email: email,
      password: hashedPassword,
      role: 'admin',
      firstLogin: false
    });

    await admin.save();
    console.log('Admin user inserted successfully');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding admin:', err.message);
    process.exit(1);
  }
};

seedAdmin();