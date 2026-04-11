const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');

// ...existing code...

// GET /api/doctors/me/appointments
const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id });
    res.json({ data: appointments });
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/me/slots
const getMySlots = async (req, res, next) => {
  try {
    const slots = await Slot.find({ doctorId: req.user.id });
    res.json({ data: slots });
  } catch (err) {
    next(err);
  }
};

// Get profile
const getProfile = async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.user.id);
    res.json(doctor);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const updated = await Doctor.findByIdAndUpdate(req.user.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Unified export object to prevent "Undefined" errors in routes
module.exports = { 
  getProfile, 
  updateProfile, 
  getMyAppointments, 
  getMySlots 
};