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
    let role = 'patient';

    if (user) {
      role = 'doctor';
    } else {
      user = await Patient.findOne({ email });
    }

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return res.status(401).json({ message: 'Invalid credentials' });
    }

    const token = jwt.sign({ id: user._id, role }, process.env.JWT_SECRET);
    res.json({ token });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { register, login };