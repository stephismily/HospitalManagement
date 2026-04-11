const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const isSameDate = (left, right) => {
  const leftDate = new Date(left);
  const rightDate = new Date(right);

  return leftDate.toISOString().slice(0, 10) === rightDate.toISOString().slice(0, 10);
};

const overlaps = (existingSlot, newSlot) => {
  if (!existingSlot || !isSameDate(existingSlot.date, newSlot.date)) {
    return false;
  }

  const existingStart = toMinutes(existingSlot.startTime);
  const existingEnd = toMinutes(existingSlot.endTime);
  const newStart = toMinutes(newSlot.startTime);
  const newEnd = toMinutes(newSlot.endTime);

  return newStart < existingEnd && newEnd > existingStart;
};

const checkPatientConflict = async (Appointment, patientId, newSlot) => {
  const appointments = await Appointment.find({
    patientId,
    status: 'booked'
  }).populate('slotId');

  return appointments.some((appointment) => overlaps(appointment.slotId, newSlot));
};

module.exports = checkPatientConflict;
