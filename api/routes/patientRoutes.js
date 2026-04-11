const express = require('express');
const { getProfile, updateProfile } = require('../controllers/patientController');
const auth = require('../middleware/authMiddleware');
const patientController = require('../controllers/patientController');

const router = express.Router();

router.get('/me/appointments', auth, patientController.getMyAppointments);
router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;