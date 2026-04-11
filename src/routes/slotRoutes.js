const express = require('express');
const router = express.Router();
const slotController = require('../controllers/slotController');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

router.post('/', auth, requireRole('doctor'), slotController.createSlot);
router.get('/', slotController.searchSlots);
router.put('/:slotId', auth, requireRole('doctor'), slotController.updateSlot);
router.delete('/:slotId', auth, requireRole('doctor'), slotController.deleteSlot);

module.exports = router;
