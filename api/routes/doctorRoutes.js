const express = require('express');
const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');

const router = express.Router();

router.get('/', doctorController.listDoctors);
router.put('/me', auth, requireRole('doctor'), doctorController.updateMe);
router.get('/me/appointments', auth, requireRole('doctor'), doctorController.getMyAppointments);
router.get('/me/slots', auth, requireRole('doctor'), doctorController.getMySlots);

module.exports = router;
