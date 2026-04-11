const express = require('express');
const { onboardDoctor, getAllDoctors, deleteDoctor } = require('../controllers/adminController');
const authMiddleware = require('../middleware/authMiddleware');
const roleMiddleware = require('../middleware/roleMiddleware');

const router = express.Router();

// Admin only routes - TO BE CONFIGURED FOR ADMIN ROLE
router.post('/onboard-doctor', authMiddleware, roleMiddleware('admin'), onboardDoctor);
router.get('/doctors', authMiddleware, roleMiddleware('admin'), getAllDoctors);
router.delete('/doctors/:doctorId', authMiddleware, roleMiddleware('admin'), deleteDoctor);

module.exports = router;
