const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  slot: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true },
  status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
  // Add other fields as needed
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);