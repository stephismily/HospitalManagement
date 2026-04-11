const mongoose = require('mongoose');

const slotSchema = new mongoose.Schema({
  date: String,
  time: String,
  specialization: String,
  doctorId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isAvailable: { type: Boolean, default: true }
});

module.exports = mongoose.model('Slot', slotSchema);
