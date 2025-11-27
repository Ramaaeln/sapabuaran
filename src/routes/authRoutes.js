const express = require('express');
const router = express.Router();
const { registerUser, verifyOTP, resendOTP, loginUser, updateFcmToken } = require('../services/authService');
const { authenticate } = require('../middlewares/authMiddleware');
const { sendNotification } = require('../utils/fcm'); // optional, kalau nanti mau kirim notif FCM

// =======================
// REGISTER → Kirim OTP via email default
// =======================
router.post('/register', async (req, res) => {
  try {
    const result = await registerUser(req.body); // body: { full_name, phone, email, birth_date }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// =======================
// VERIFY OTP → Simpan password
// =======================
router.post('/verify-otp', async (req, res) => {
  try {
    const result = await verifyOTP(req.body); // body: { user_id, otp, password }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// =======================
// RESEND OTP → Pilih metode email/WA
// =======================
router.post('/resend-otp', async (req, res) => {
  try {
    const result = await resendOTP(req.body); // body: { email, otp_method? }
    return res.status(200).json(result);
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

// =======================
// LOGIN
// =======================
router.post('/login', async (req, res) => {
  try {
    const result = await loginUser({
      identifier: req.body.identifier, // email atau phone
      password: req.body.password
    });
    return res.status(200).json(result);
  } catch (error) {
    return res.status(400).json({ message: error.message });
  }
});

// =======================
// UPDATE FCM TOKEN
// =======================
router.post('/fcm-token', authenticate, async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'FCM token required' });

    await updateFcmToken(req.user.id, token);

    return res.json({ message: 'FCM token updated' });
  } catch (err) {
    return res.status(400).json({ message: err.message });
  }
});

module.exports = router;
