const Patient = require('../models/Patient');
const Appointment = require('../models/Appointment');

const updateMe = async (req, res, next) => {
  try {
    const blockedFields = ['password', 'role'];
    const updates = { ...req.body };
    blockedFields.forEach((field) => delete updates[field]);

    const updated = await Patient.findByIdAndUpdate(req.user.id, updates, {
      new: true,
      runValidators: true
    }).select('-password');

    if (!updated) {
      return res.status(404).json({ error: 'Patient not found' });
    }

    return res.json({ data: updated });
  } catch (err) {
    next(err);
  }
};

const getMyAppointments = async (req, res, next) => {
  try {
    const appointments = await Appointment.find({ patientId: req.user.id })
      .populate('doctorId', '-password')
      .populate('slotId');

    return res.json({ data: appointments });
  } catch (err) {
    next(err);
  }
};

module.exports = { updateMe, getMyAppointments };
