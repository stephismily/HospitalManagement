const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const Doctor = require('../models/Doctor');
const Patient = require('../models/Patient');

const JWT_SECRET = process.env.JWT_SECRET || 'change_this_secret';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

const createToken = (user) => {
  return jwt.sign(
    { userId: user._id, role: user.role },
    JWT_SECRET,
    { expiresIn: JWT_EXPIRES_IN }
  );
};

const sanitizeUser = (user) => ({
  id: user._id,
  role: user.role,
  email: user.email,
  name: user.patientName || user.doctorName,
  firstLogin: user.firstLogin
});

const findUserByEmail = async (email) => {
  const doctor = await Doctor.findOne({ email });
  if (doctor) return doctor;

  return Patient.findOne({ email });
};

const register = async (req, res, next) => {
  try {
    const { role = 'patient', email, password, contact } = req.body;

    if (!['doctor', 'patient'].includes(role)) {
      return res.status(400).json({ error: 'role must be either "doctor" or "patient"' });
    }

    if (!email || !password || !contact) {
      return res.status(400).json({ error: 'email, password and contact are required' });
    }

    const existing = await findUserByEmail(email);
    if (existing) {
      return res.status(409).json({ error: 'Email already in use' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    let user;

    if (role === 'doctor') {
      const { doctorName, specialization } = req.body;
      if (!doctorName || !specialization) {
        return res.status(400).json({ error: 'doctorName and specialization are required for doctor registration' });
      }

      user = new Doctor({
        doctorName,
        specialization,
        contact,
        email,
        password: passwordHash,
        role: 'doctor',
        firstLogin: false
      });
    } else {
      const { patientName, dob, address } = req.body;
      if (!patientName || !dob) {
        return res.status(400).json({ error: 'patientName and dob are required for patient registration' });
      }

      user = new Patient({
        patientName,
        contact,
        email,
        password: passwordHash,
        dob,
        address,
        role: 'patient'
      });
    }

    await user.save();

    return res.status(201).json({
      data: {
        user: sanitizeUser(user),
        token: createToken(user)
      }
    });
  } catch (err) {
    next(err);
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    if (!email || !password) {
      return res.status(400).json({ error: 'email and password are required' });
    }

    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    return res.json({
      data: {
        user: sanitizeUser(user),
        token: createToken(user),
        firstLogin: Boolean(user.firstLogin)
      }
    });
  } catch (err) {
    next(err);
  }
};

const changePasswordFirstLogin = async (req, res, next) => {
  const { newPassword } = req.body;
  try {
    if (!newPassword) {
      return res.status(400).json({ error: 'newPassword is required' });
    }

    const doctor = await Doctor.findById(req.user.id);
    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    if (!doctor.firstLogin) {
      return res.status(400).json({ error: 'This endpoint is only for first login' });
    }

    doctor.password = await bcrypt.hash(newPassword, 10);
    doctor.firstLogin = false;
    await doctor.save();

    return res.json({ data: { message: 'Password changed successfully' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { register, login, changePasswordFirstLogin };
