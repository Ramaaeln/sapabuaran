const express = require('express');
const router = express.Router();
const admin = require('../services/firebase');
const supabase = require('../utils/supabaseClient');
const rateLimit = require('express-rate-limit');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');

// 1. Rate limiting (anti spam)
const notifLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 menit
  max: 20,             // max 20 request / menit / IP
  message: { message: "Too many requests, slow down" },
});

// 2. SEND NOTIF KE USER TERTENTU
router.post(
  '/send',
  authenticate,
  authorizeRoles('admin'),
  notifLimiter,
  async (req, res) => {
    const { userId, title, body } = req.body;

    if (!userId || !title || !body) {
      return res.status(400).json({ message: "Missing fields" });
    }

    // Validation
    if (title.length > 120 || body.length > 500) {
      return res.status(400).json({ message: "Message too long" });
    }

    try {
      const { data: user, error } = await supabase
        .from('profiles')
        .select('fcm_token')
        .eq('id', userId)
        .single();

      if (error || !user) {
        return res.status(404).json({ message: "User not found" });
      }

      const token = user.fcm_token;
      if (!token) {
        return res.status(400).json({ message: "User has no FCM token" });
      }

      const message = {
        token,
        notification: {
          title,
          body,
        },
        android: { priority: "high" },
      };

      const response = await admin.messaging().send(message);

      console.log(`[NOTIF SEND] Admin ${req.user.id} → user ${userId} ✔`);

      return res.json({ success: true, message: "Notification sent", response });

    } catch (err) {
      console.error("FCM Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// 3. BROADCAST NOTIF KE SEMUA USER
router.post(
  '/broadcast',
  authenticate,
  authorizeRoles('admin'),
  notifLimiter,
  async (req, res) => {
    const { title, body } = req.body;

    if (!title || !body) {
      return res.status(400).json({ message: "Missing fields" });
    }

    if (title.length > 120 || body.length > 500) {
      return res.status(400).json({ message: "Message too long" });
    }

    try {
      const { data: users, error } = await supabase
        .from('profiles')
        .select('id, fcm_token');

      if (error) {
        return res.status(500).json({ message: "DB error" });
      }

      const tokens = users
        .map(u => u.fcm_token)
        .filter(t => t && t.length > 20);

      if (tokens.length === 0) {
        return res.status(400).json({ message: "No valid tokens" });
      }

      const message = {
        tokens,
        notification: { title, body },
      };

      const response = await admin.messaging().sendMulticast(message);

      // Auto-remove invalid tokens
      response.responses.forEach(async (r, index) => {
        if (!r.success) {
          const token = tokens[index];
          if (r.error?.code === 'messaging/registration-token-not-registered') {
            await supabase
              .from('profiles')
              .update({ fcm_token: null })
              .eq('fcm_token', token);

            console.log(`[TOKEN REMOVED] Invalid token cleaned: ${token}`);
          }
        }
      });

      console.log(`[BROADCAST] Admin ${req.user.id} → sent ${response.successCount}`);

      return res.json({
        success: true,
        sent: response.successCount,
        failed: response.failureCount,
      });

    } catch (err) {
      console.error("Broadcast error:", err);
      return res.status(500).json({ message: "Internal error" });
    }
  }
);

module.exports = router;
