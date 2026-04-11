const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');

const listDoctors = async (req, res, next) => {
  try {
    const doctors = await Doctor.find().select('-password');
    return res.json({ data: doctors });
  } catch (err) {
    next(err);
  }
};

const getMe = async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.user.id).select('-password');

    if (!doctor) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.json({ data: doctor });
  } catch (err) {
    next(err);
  }
};

const updateMe = async (req, res, next) => {
  try {
    const blockedFields = ['password', 'role', 'firstLogin'];
    const updates = { ...req.body };
    blockedFields.forEach((field) => delete updates[field]);

    const updated = await Doctor.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!updated) {
      return res.status(404).json({ error: 'Doctor not found' });
    }

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ doctorId: req.user.id })
      .populate('patientId', '-password')
      .populate('slotId');

    return res.json({ data: appointments });
  } catch (err) {
    next(err);
  }
};

const getMySlots = async (req, res, next) => {
  try {
    const slots = await Slot.find({ doctorId: req.user.id });
    return res.json({ data: slots });
  } catch (err) {
    next(err);
  }
};

module.exports = { listDoctors, getMe, updateMe, getMyAppointments, getMySlots };
