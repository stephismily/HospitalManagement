const Patient = require('../models/Patient');

// Get profile
const getProfile = async (req, res) => {
  try {
    const patient = await Patient.findById(req.user.id);
    res.json(patient);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update profile
const updateProfile = async (req, res) => {
  try {
    const updated = await Patient.findByIdAndUpdate(req.user.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// ...existing code...

// GET /api/patients/me/appointments
exports.getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await require('../models/Appointment').find({ patientId: req.user.id });
    res.json({ data: appointments });
  } catch (err) {
    next(err);
  }
};

module.exports = { getProfile, updateProfile };