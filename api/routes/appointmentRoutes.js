const express = require('express');
const { bookAppointment, cancelAppointment, completeAppointment } = require('../controllers/appointmentController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/book', auth, bookAppointment);
router.put('/:id/cancel', auth, cancelAppointment);
router.put('/:id/complete', auth, completeAppointment);

module.exports = router;