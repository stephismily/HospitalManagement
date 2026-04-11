const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');
// const checkPatientConflict = require('../utils/checkPatientConflict'); // Optional

// POST /api/appointments
exports.bookAppointment = async (req, res, next) => {
  try {
    const patientId = req.user.id;
    const { doctorId, slotId } = req.body;
    if (!doctorId || !slotId) return res.status(400).json({ error: 'doctorId and slotId are required' });

    const slot = await Slot.findById(slotId);
    if (!slot.isAvailable) return res.status(400).json({ message: 'Slot not available' });
    const appointment = new Appointment({ patient: req.user.id, doctor: slot.doctor, slot: slotId });
    await appointment.save();
    slot.isAvailable = false;
    await slot.save();
    return res.status(201).json({ data: appointment });
  } catch (err) {
    next(err);
  }
};

// GET /api/appointments/:id
exports.getAppointmentById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (
      req.user.id !== appointment.patientId.toString() &&
      req.user.id !== appointment.doctorId.toString()
    ) {
      return res.status(403).json({ error: 'Unauthorized access' });
    }
    return res.json({ data: appointment });
  } catch (err) {
    next(err);
  }
};

// PUT /api/appointments/:id/cancel
exports.cancelAppointment = async (req, res, next) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    const slot = await Slot.findById(appointment.slot);
    slot.isAvailable = true;
    await slot.save();
    appointment.status = 'cancelled';
    if (req.body.cancelReason) appointment.cancelReason = req.body.cancelReason;
    await appointment.save();
    // Release slot
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

// PUT /api/appointments/:id/complete
exports.completeAppointment = async (req, res, next) => {
  try {
    const { id } = req.params;
    const appointment = await Appointment.findById(id);
    if (!appointment) return res.status(404).json({ error: 'Appointment not found' });
    if (req.user.id !== appointment.doctorId.toString()) {
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

// ...existing code...

// GET /api/appointments?doctorId=...&patientId=...
exports.listAppointments = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.doctorId) filter.doctorId = req.query.doctorId;
    if (req.query.patientId) filter.patientId = req.query.patientId;
    const appointments = await Appointment.find(filter);
    res.json({ data: appointments });
  } catch (err) {
    next(err);
  }
};