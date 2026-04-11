const express = require('express');
const { getProfile, updateProfile } = require('../controllers/patientController');
const auth = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/profile', auth, getProfile);
router.put('/profile', auth, updateProfile);

module.exports = router;