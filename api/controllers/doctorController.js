const Doctor = require('../models/Doctor');
const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');

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

// GET /api/doctors/me/slots
exports.getMySlots = async (req, res, next) => {
  try {
    const slots = await require('../models/Slot').find({ doctorId: req.user.id });
    res.json({ data: slots });
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

module.exports = { listDoctors, updateMe, getMyAppointments, getMySlots };
