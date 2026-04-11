const Doctor = require('../models/Doctor');

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