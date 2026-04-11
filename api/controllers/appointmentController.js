const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
const checkPatientConflict = require('../utils/checkPatientConflict');

const idToString = (value) => {
  if (!value) return '';
  return (value._id || value).toString();
};

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
};

exports.bookAppointment = async (req, res, next) => {
  let claimedSlot;
  let createdSplitSlots = [];
  let originalSlot;

  try {
    const { slotId, startTime, endTime } = req.body;
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

    originalSlot = {
      startTime: slot.startTime,
      endTime: slot.endTime
    };

    const appointmentStartTime = startTime || slot.startTime;
    const appointmentEndTime = endTime || slot.endTime;

    if (!isValidTime(appointmentStartTime) || !isValidTime(appointmentEndTime)) {
      return res.status(400).json({ error: 'startTime and endTime must be in HH:mm format' });
    }

    const slotStart = toMinutes(slot.startTime);
    const slotEnd = toMinutes(slot.endTime);
    const appointmentStart = toMinutes(appointmentStartTime);
    const appointmentEnd = toMinutes(appointmentEndTime);

    if (appointmentEnd <= appointmentStart) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    if (appointmentStart < slotStart || appointmentEnd > slotEnd) {
      return res.status(400).json({ error: 'Selected time must be within the available slot' });
    }

    if (appointmentEnd - appointmentStart !== 30) {
      return res.status(400).json({ error: 'Appointments must be 30 minutes long' });
    }

    const requestedSlot = {
      date: slot.date,
      startTime: appointmentStartTime,
      endTime: appointmentEndTime
    };

    const hasConflict = await checkPatientConflict(Appointment, req.user.id, requestedSlot);
    if (hasConflict) {
      return res.status(409).json({ error: 'Patient already has an overlapping appointment' });
    }

    claimedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, isAvailable: true },
      {
        $set: {
          startTime: appointmentStartTime,
          endTime: appointmentEndTime,
          isAvailable: false
        }
      },
      { new: true }
    );

    if (!claimedSlot) {
      return res.status(409).json({ error: 'Slot not available' });
    }

    const splitSlots = [];

    if (appointmentStart > slotStart) {
      splitSlots.push({
        doctorId: claimedSlot.doctorId,
        date: claimedSlot.date,
        startTime: slot.startTime,
        endTime: appointmentStartTime,
        isAvailable: true
      });
    }

    if (appointmentEnd < slotEnd) {
      splitSlots.push({
        doctorId: claimedSlot.doctorId,
        date: claimedSlot.date,
        startTime: appointmentEndTime,
        endTime: slot.endTime,
        isAvailable: true
      });
    }

    if (splitSlots.length) {
      createdSplitSlots = await Slot.insertMany(splitSlots);
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
    if (createdSplitSlots.length) {
      await Slot.deleteMany({ _id: { $in: createdSplitSlots.map((splitSlot) => splitSlot._id) } });
    }

    if (claimedSlot) {
      await Slot.findByIdAndUpdate(claimedSlot._id, {
        $set: {
          startTime: originalSlot.startTime,
          endTime: originalSlot.endTime,
          isAvailable: true
        }
      });
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

    if (!req.body.cancelReason || !req.body.cancelReason.trim()) {
      return res.status(400).json({ error: 'cancelReason is required' });
    }

    appointment.status = 'cancelled';
    appointment.cancelReason = req.body.cancelReason.trim();
    await appointment.save();

    const slot = await Slot.findById(appointment.slotId);
    if (slot) {
      await Slot.create({
        doctorId: slot.doctorId,
        date: slot.date,
        startTime: slot.startTime,
        endTime: slot.endTime,
        isAvailable: true
      });
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

    if (!req.body.doctorNotes || !req.body.doctorNotes.trim()) {
      return res.status(400).json({ error: 'doctorNotes is required' });
    }

    appointment.status = 'completed';
    appointment.doctorNotes = req.body.doctorNotes.trim();
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
