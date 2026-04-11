const mongoose = require('mongoose');

const patientSchema = new mongoose.Schema({
  patientName: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  dob: { type: Date, required: true },
  address: { type: String },
  role: { type: String, default: 'patient' }
}, { timestamps: true });

module.exports = mongoose.model('Patient', patientSchema);