const Appointment = require('../models/Appointment');
const Slot = require('../models/Slot');

// Book appointment
const bookAppointment = async (req, res) => {
  try {
    const { slotId } = req.body;
    const slot = await Slot.findById(slotId);
    if (!slot.isAvailable) return res.status(400).json({ message: 'Slot not available' });
    const appointment = new Appointment({ patient: req.user.id, doctor: slot.doctor, slot: slotId });
    await appointment.save();
    slot.isAvailable = false;
    await slot.save();
    res.status(201).json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Cancel appointment
const cancelAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id);
    if (!appointment) return res.status(404).json({ message: 'Appointment not found' });
    const slot = await Slot.findById(appointment.slot);
    slot.isAvailable = true;
    await slot.save();
    appointment.status = 'cancelled';
    await appointment.save();
    res.json({ message: 'Appointment cancelled' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Complete appointment
const completeAppointment = async (req, res) => {
  try {
    const appointment = await Appointment.findByIdAndUpdate(req.params.id, { status: 'completed' }, { new: true });
    res.json(appointment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { bookAppointment, cancelAppointment, completeAppointment };