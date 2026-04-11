const express = require('express');
const { 
  getProfile, 
  updateProfile, 
  getMyAppointments, 
  getMySlots 
} = require('../controllers/doctorController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);
router.get('/me/appointments', auth, getMyAppointments);
router.get('/me/slots', auth, getMySlots);

module.exports = router;