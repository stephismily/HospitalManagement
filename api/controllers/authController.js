const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Register
const register = async (req, res) => {
  const { patientName, contact, email, password, dob, address } = req.body;
  try {
    const user = new Patient({
      patientName,
      contact,
      email,
      password: await bcrypt.hash(password, 10),
      dob,
      address
    });
    await user.save();
    res.status(201).json({ message: 'Patient registered successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
const login = async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await Doctor.findOne({ email });
    let role;

    if (user) {
      role = user.role;
    } else {
      user = await Patient.findOne({ email });
      if (user) role = user.role;
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role, firstLogin: user.firstLogin }, process.env.JWT_SECRET);
    
    // Check if it's doctor's first login
    if (user.firstLogin) {
      return res.json({ token, firstLogin: true, message: 'Please change your password' });
    }
    
    res.json({ token, firstLogin: false });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Change Password on First Login
const changePasswordFirstLogin = async (req, res) => {
  const { newPassword } = req.body;
  try {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    if (!doctor.firstLogin) {
      return res.status(400).json({ message: 'This endpoint is only for first login' });
    }

    // Hash new password and update
    doctor.password = await bcrypt.hash(newPassword, 10);
    doctor.firstLogin = false;
    await doctor.save();

    res.json({ message: 'Password changed successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login, changePasswordFirstLogin };