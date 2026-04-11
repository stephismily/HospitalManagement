const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

// Register
const register = async (req, res) => {
  const { name, email, password, role, specialization } = req.body;
  try {
    let user;
    if (role === 'doctor') {
      user = new Doctor({ name, email, password: await bcrypt.hash(password, 10), specialization });
    } else {
      user = new Patient({ name, email, password: await bcrypt.hash(password, 10) });
    }
    await user.save();
    res.status(201).json({ message: 'User registered' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Login
const login = async (req, res) => {
  const { email, password, role } = req.body;
  try {
    const Model = role === 'doctor' ? Doctor : Patient;
    const user = await Model.findOne({ email });
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