const express = require('express');
const { getProfile, updateProfile } = require('../controllers/doctorController');

const doctorController = require('../controllers/doctorController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/me/appointments', auth, doctorController.getMyAppointments);
router.get('/me/slots', auth, doctorController.getMySlots);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;