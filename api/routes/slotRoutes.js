const express = require('express');
const { createSlot, searchSlots, updateSlot, deleteSlot } = require('../controllers/slotController');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/', auth, requireRole('doctor'), createSlot);
router.get('/', searchSlots);
router.put('/:slotId', auth, requireRole('doctor'), updateSlot);
router.delete('/:slotId', auth, requireRole('doctor'), deleteSlot);

module.exports = router;
