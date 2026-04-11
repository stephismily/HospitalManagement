const Doctor = require('../models/Doctor');

// ...existing code...

// GET /api/doctors/me/appointments
exports.getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await require('../models/Appointment').find({ doctorId: req.user.id });
    res.json({ data: appointments });
  } catch (err) {
    next(err);
  }
};

// GET /api/doctors/me/slots
exports.getMySlots = async (req, res, next) => {
  try {
    const slots = await require('../models/Slot').find({ doctorId: req.user.id });
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

module.exports = { getProfile, updateProfile };