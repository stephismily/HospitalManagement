const express = require('express');
const auth = require('../middleware/authMiddleware');
const requireRole = require('../middleware/roleMiddleware');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.put('/me', auth, requireRole('patient'), patientController.updateMe);
router.get('/me', auth, requireRole('patient'), patientController.getMe);
router.get('/me/appointments', auth, requireRole('patient'), patientController.getMyAppointments);

module.exports = router;
