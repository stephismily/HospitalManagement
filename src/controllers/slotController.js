const Slot = require('../../models/Slot'); // Assumed to exist

// POST / - Create slot (doctor only)
exports.createSlot = async (req, res, next) => {
	try {
		const { date, time, specialization } = req.body;
		if (!date || !time || !specialization) {
			return res.status(400).json({ error: 'date, time, and specialization are required' });
		}
		const slot = await Slot.create({
			date,
			time,
			specialization,
			doctorId: req.user.id,
			isAvailable: true
		});
		return res.status(201).json({ data: slot });
	} catch (err) {
		next(err);
	}
};

// GET / - Search/filter slots (public)
exports.searchSlots = async (req, res, next) => {
	try {
		const { doctorId, date, specialization, isAvailable } = req.query;
		const filter = {};
		if (doctorId) filter.doctorId = doctorId;
		if (date) filter.date = date;
		if (specialization) filter.specialization = specialization;
		if (isAvailable !== undefined) filter.isAvailable = isAvailable === 'true';
		const slots = await Slot.find(filter);
		return res.json({ data: slots });
	} catch (err) {
		next(err);
	}
};

// PUT /:slotId - Update slot (doctor only, must own slot)
exports.updateSlot = async (req, res, next) => {
	try {
		const { slotId } = req.params;
		const slot = await Slot.findById(slotId);
		if (!slot) return res.status(404).json({ error: 'Slot not found' });
		if (slot.doctorId.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden: not your slot' });
		if (!slot.isAvailable) return res.status(400).json({ error: 'Cannot update a booked slot' });
		const updates = req.body;
		Object.assign(slot, updates);
		await slot.save();
		return res.json({ data: slot });
	} catch (err) {
		next(err);
	}
};

// DELETE /:slotId - Delete slot (doctor only, must own slot)
exports.deleteSlot = async (req, res, next) => {
	try {
		const { slotId } = req.params;
		const slot = await Slot.findById(slotId);
		if (!slot) return res.status(404).json({ error: 'Slot not found' });
		if (slot.doctorId.toString() !== req.user.id) return res.status(403).json({ error: 'Forbidden: not your slot' });
		if (!slot.isAvailable) return res.status(400).json({ error: 'Cannot delete a booked slot' });
		await slot.deleteOne();
		return res.json({ data: 'Slot deleted' });
	} catch (err) {
		next(err);
	}
};
