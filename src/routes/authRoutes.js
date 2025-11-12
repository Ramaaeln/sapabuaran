const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, resendOTP, loginUser } = require('../services/authService');

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
  

module.exports = router;
