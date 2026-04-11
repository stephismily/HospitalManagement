const express = require('express');
const { createSlot, getSlots, updateSlot, deleteSlot } = require('../controllers/slotController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/', auth, createSlot);
router.get('/', auth, getSlots);
router.put('/:id', auth, updateSlot);
router.delete('/:id', auth, deleteSlot);

module.exports = router;