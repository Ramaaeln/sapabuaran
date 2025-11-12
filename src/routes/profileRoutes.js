const express = require('express');
const router = express.Router();
const { getMe, updateMe } = require('../controllers/profileController');
const { authenticate } = require('../middlewares/authMiddleware');

// Get own profile
router.get('/me', authenticate, getMe);

// Update own profile
router.put('/me', authenticate, updateMe);

module.exports = router;
