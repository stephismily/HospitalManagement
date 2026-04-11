const mongoose = require('mongoose');

const doctorSchema = new mongoose.Schema({
  doctorName: { type: String, required: true },
  specialization: { type: String, required: true },
  contact: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'doctor' }
}, { timestamps: true });

module.exports = mongoose.model('Doctor', doctorSchema);