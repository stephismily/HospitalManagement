const express = require('express');
const { register, login, changePasswordFirstLogin } = require('../controllers/authController');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

router.post('/register', register);
router.post('/login', login);
router.post('/change-password-first-login', authMiddleware, changePasswordFirstLogin);

module.exports = router;