const Slot = require('../models/Slot');
const Doctor = require('../models/Doctor');

const toMinutes = (time) => {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
};

const formatMinutes = (totalMinutes) => {
  const hours = Math.floor(totalMinutes / 60).toString().padStart(2, '0');
  const minutes = (totalMinutes % 60).toString().padStart(2, '0');
  return `${hours}:${minutes}`;
};

const isValidTime = (time) => {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(time);
};

const createSlot = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'date, startTime and endTime are required' });
    }

    if (!isValidTime(startTime) || !isValidTime(endTime)) {
      return res.status(400).json({ error: 'startTime and endTime must be in HH:mm format' });
    }

    const start = toMinutes(startTime);
    const end = toMinutes(endTime);

    if (end <= start) {
      return res.status(400).json({ error: 'endTime must be after startTime' });
    }

    if ((end - start) % 30 !== 0) {
      return res.status(400).json({ error: 'Slot duration must be divisible into 30-minute blocks' });
    }

    const slots = [];
    for (let time = start; time < end; time += 30) {
      slots.push({
        date,
        doctorId: req.user.id,
        startTime: formatMinutes(time),
        endTime: formatMinutes(time + 30),
        isAvailable: true
      });
    }

    const createdSlots = await Slot.insertMany(slots);
    return res.status(201).json({ data: createdSlots });
  } catch (err) {
    next(err);
  }
};

const searchSlots = async (req, res, next) => {
  try {
    const { doctorId, doctorName, date, specialization, isAvailable } = req.query;
    const filter = {};

    if (doctorId) filter.doctorId = doctorId;

    if (date) {
      const start = new Date(date);
      const end = new Date(date);
      end.setDate(end.getDate() + 1);
      filter.date = { $gte: start, $lt: end };
    }

    if (isAvailable !== undefined) {
      filter.isAvailable = isAvailable === 'true';
    }

    if (specialization || doctorName) {
      const doctorFilter = {};

      if (specialization) {
        doctorFilter.specialization = { $regex: specialization, $options: 'i' };
      }

      if (doctorName) {
        doctorFilter.doctorName = { $regex: doctorName, $options: 'i' };
      }

      if (doctorId) {
        doctorFilter._id = doctorId;
      }

      const doctors = await Doctor.find(doctorFilter).select('_id');

      const doctorIds = doctors.map((doctor) => doctor._id);
      filter.doctorId = { $in: doctorIds };
    }

    const slots = await Slot.find(filter).populate('doctorId', '-password');
    return res.json({ data: slots });
  } catch (err) {
    next(err);
  }
};

const updateSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slot.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own slots' });
    }

    if (!slot.isAvailable) {
      return res.status(400).json({ error: 'Cannot update a booked slot' });
    }

    const allowedUpdates = ['date', 'startTime', 'endTime', 'isAvailable'];
    allowedUpdates.forEach((field) => {
      if (req.body[field] !== undefined) {
        slot[field] = req.body[field];
      }
    });

    await slot.save();
    return res.json({ data: slot });
  } catch (err) {
    next(err);
  }
};

const deleteSlot = async (req, res, next) => {
  try {
    const slot = await Slot.findById(req.params.slotId);
    if (!slot) {
      return res.status(404).json({ error: 'Slot not found' });
    }

    if (slot.doctorId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only delete your own slots' });
    }

    if (!slot.isAvailable) {
      return res.status(400).json({ error: 'Cannot delete a booked slot' });
    }

    await slot.deleteOne();
    return res.json({ data: { message: 'Slot deleted' } });
  } catch (err) {
    next(err);
  }
};

module.exports = { createSlot, searchSlots, updateSlot, deleteSlot };
