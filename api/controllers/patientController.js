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

module.exports = { getProfile, updateProfile };