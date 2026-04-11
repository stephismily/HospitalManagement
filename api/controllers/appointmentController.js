const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const checkPatientConflict = require('../utils/checkPatientConflict');

const idToString = (value) => {
  if (!value) return '';
  return (value._id || value).toString();
};

exports.bookAppointment = async (req, res, next) => {
  let claimedSlot;

  try {
    const { slotId } = req.body;
    if (!slotId) {
      return res.status(400).json({ error: 'slotId is required' });
    }

    const slot = await Slot.findById(slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (!slot.isAvailable) {
      return res.status(400).json({ error: 'Slot not available' });
    }

    const hasConflict = await checkPatientConflict(Appointment, req.user.id, slot);
    if (hasConflict) {
      return res.status(409).json({ error: 'Patient already has an overlapping appointment' });
    }

    claimedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, isAvailable: true },
      { $set: { isAvailable: false } },
      { new: true }
    );

    if (!claimedSlot) {
      return res.status(409).json({ error: 'Slot not available' });
    }

    const appointment = new Appointment({
      patientId: req.user.id,
      doctorId: claimedSlot.doctorId,
      slotId: claimedSlot._id,
      status: 'booked'
    });
    await appointment.save();

    return res.status(201).json({ data: appointment });
  } catch (err) {
    if (claimedSlot) {
      await Slot.findByIdAndUpdate(claimedSlot._id, { $set: { isAvailable: true } });
    }
    next(err);
  }
};

exports.getAppointmentById = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id)
      .populate('doctorId', '-password')
      .populate('patientId', '-password')
      .populate('slotId');

    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (
      req.user.role !== 'admin' &&
      req.user.id !== idToString(appointment.patientId) &&
      req.user.id !== idToString(appointment.doctorId)
    ) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    return res.json({ data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    const isOwner = req.user.id === idToString(appointment.patientId) || req.user.id === idToString(appointment.doctorId);
    if (!isOwner) {
      return res.status(403).json({ error: 'Only the patient or doctor can cancel this appointment' });
    }

    if (appointment.status !== 'booked') {
      return res.status(400).json({ error: 'Only booked appointments can be cancelled' });
    }

    appointment.status = 'cancelled';
    if (req.body.cancelReason) appointment.cancelReason = req.body.cancelReason;
    await appointment.save();

    const slot = await Slot.findById(appointment.slotId);
    if (slot) {
      slot.isAvailable = true;
      await slot.save();
    }
    return res.json({ data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.completeAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) {
      return res.status(404).json({ error: 'Appointment not found' });
    }

    if (req.user.id !== idToString(appointment.doctorId)) {
      return res.status(403).json({ error: 'Only the doctor can complete this appointment' });
    }
    if (appointment.status !== 'booked') {
      return res.status(400).json({ error: 'Only booked appointments can be completed' });
    }
    appointment.status = 'completed';
    if (req.body.doctorNotes) appointment.doctorNotes = req.body.doctorNotes;
    await appointment.save();
    return res.json({ data: appointment });
  } catch (err) {
    next(err);
  }
};

exports.listAppointments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.patientId) filter.patientId = req.query.patientId;

    const appointments = await Appointment.find(filter)
      .populate('doctorId', '-password')
      .populate('patientId', '-password')
      .populate('slotId');

    res.json({ data: appointments });
  } catch (err) {
    next(err);
  }
};
