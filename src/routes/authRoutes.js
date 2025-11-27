const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, resendOTP, loginUser,updateFcmToken} = require('../services/authService');
const { authenticate } = require('../middlewares/authMiddleware');

// Register → OTP default dikirim ke email
router.post('/register', async (req, res) => {
  try {
    const result = await registerUser(req.body); // body: { full_name, phone, email, birth_date }
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Verify OTP + simpan password
router.post('/verify-otp', async (req, res) => {
  try {
    const result = await verifyOTP(req.body); // body: { user_id, otp, password }
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Resend OTP → bisa pilih metode (email/WA)
router.post('/resend-otp', async (req, res) => {
  try {
    const result = await resendOTP(req.body); // body: { email, otp_method? }
    res.status(200).json(result);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// Login
router.post('/login', async (req, res) => {
    try {
      const result = await loginUser({
        identifier: req.body.identifier, // email atau phone
        password: req.body.password
      });
      res.status(200).json(result);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  router.post('/fcm-token', authenticate, async (req, res, next) => {
    try {
      const { token } = req.body;
  
      if (!token) return res.status(400).json({ message: 'FCM token required' });
  
      await updateFcmToken(req.user.id, token);
      res.json({ message: 'FCM token updated' });
  
    } catch (err) { next(err); }
  });

module.exports = router;
