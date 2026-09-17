const express = require('express');
const router = express.Router();
const { login, register, firebaseLogin, getMe, logout } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { loginLimiter } = require('../middleware/rateLimiter');

router.post('/login', loginLimiter, login);
router.post('/register', register);
router.post('/firebase-login', firebaseLogin);
router.get('/me', protect, getMe);
router.post('/logout', protect, logout);

module.exports = router;


