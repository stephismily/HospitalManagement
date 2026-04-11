const Slot = require('../models/Slot');
const Doctor = require('../models/Doctor');

const createSlot = async (req, res, next) => {
  try {
    const { date, startTime, endTime } = req.body;
    if (!date || !startTime || !endTime) {
      return res.status(400).json({ error: 'date, startTime and endTime are required' });
    }

    const slot = new Slot({
      date,
      startTime,
      endTime,
      doctorId: req.user.id,
      isAvailable: req.body.isAvailable !== undefined ? req.body.isAvailable : true
    });
    await slot.save();
    return res.status(201).json({ data: slot });
  } catch (err) {
    next(err);
  }
};

const searchSlots = async (req, res, next) => {
  try {
    const { doctorId, date, specialization, isAvailable } = req.query;
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

    if (specialization) {
      const doctorFilter = {
        specialization: { $regex: specialization, $options: 'i' }
      };

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
