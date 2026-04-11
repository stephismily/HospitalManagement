const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
router.get('/', auth, appointmentController.listAppointments);
// Book appointment (patient only)
router.post('/', auth, requireRole('patient'), appointmentController.bookAppointment);

// Get appointment details (owner only)
router.get('/:id', auth, appointmentController.getAppointmentById);

// Cancel appointment (patient or doctor)
router.put('/:id/cancel', auth, appointmentController.cancelAppointment);

// Complete appointment (doctor only)
router.put('/:id/complete', auth, requireRole('doctor'), appointmentController.completeAppointment);

module.exports = router;