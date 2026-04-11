const Slot = require('../models/Slot');

// Create slot
const createSlot = async (req, res) => {
  try {
    const slot = new Slot({ ...req.body, doctor: req.user.id });
    await slot.save();
    res.status(201).json(slot);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Get slots
const getSlots = async (req, res) => {
  try {
    const slots = await Slot.find({ doctor: req.user.id });
    res.json(slots);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Update slot
const updateSlot = async (req, res) => {
  try {
    const updated = await Slot.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

// Delete slot
const deleteSlot = async (req, res) => {
  try {
    await Slot.findByIdAndDelete(req.params.id);
    res.json({ message: 'Slot deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = { createSlot, getSlots, updateSlot, deleteSlot };