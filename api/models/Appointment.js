const mongoose = require('mongoose');

const appointmentSchema = new mongoose.Schema({
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Doctor', required: true },
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: 'Patient', required: true },
  slotId: { type: mongoose.Schema.Types.ObjectId, ref: 'Slot', required: true, unique: true },
  status: { type: String, enum: ['booked', 'completed', 'cancelled'], default: 'booked' },
  doctorNotes: { type: String },
  cancelReason: { type: String }
}, { timestamps: true });

module.exports = mongoose.model('Appointment', appointmentSchema);