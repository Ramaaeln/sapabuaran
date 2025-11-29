const express = require('express');
const router = express.Router();
const admin = require('../services/firebase');
const supabase = require('../utils/supabaseClient');
const rateLimit = require('express-rate-limit');
const { authenticate, authorizeRoles } = require('../middlewares/authMiddleware');

// RATE LIMIT
const notifLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { message: "Too many requests, slow down" },
});

// -----------------------------------------------------------------------------
// SEND NOTIFICATION TO SPECIFIC USER
// -----------------------------------------------------------------------------
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

      await admin.messaging().send({
        token,
        notification: { title, body },
        android: { priority: "high" }
      });

      console.log(`[NOTIF SEND] Admin ${req.user.id} → user ${userId}`);

      return res.json({ success: true, message: "Notification sent" });

    } catch (err) {
      console.error("FCM Error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);


// -----------------------------------------------------------------------------
// GET ALL BROADCAST LOG
// -----------------------------------------------------------------------------
router.get(
  '/broadcast',
  authenticate,
  authorizeRoles('admin'),
  async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('broadcast_logs')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        return res.status(500).json({ message: "DB error" });
      }

      return res.json({ notifications: data });
    } catch (err) {
      console.error("GET broadcast error:", err);
      return res.status(500).json({ message: "Internal server error" });
    }
  }
);

// -----------------------------------------------------------------------------
// BROADCAST NOTIFICATION (NO sendMulticast) — 100% COMPAT VERCEL
// -----------------------------------------------------------------------------
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

      let successCount = 0;
      let failureCount = 0;

      for (const token of tokens) {
        try {
          await admin.messaging().send({
            token,
            notification: { title, body }
          });

          successCount++;
        } catch (err) {
          failureCount++;

          if (err.errorInfo?.code === 'messaging/registration-token-not-registered') {
            await supabase
              .from('profiles')
              .update({ fcm_token: null })
              .eq('fcm_token', token);

            console.log(`[CLEANED TOKEN] removed invalid token`);
          }
        }
      }

      console.log(`[BROADCAST] Admin ${req.user.id} → Sent ${successCount}, Failed ${failureCount}`);

      // -----------------------------------------------------------------------
      //  🔥 MASUKKAN DI SINI UNTUK SIMPAN LOG BROADCAST
      // -----------------------------------------------------------------------
      await supabase.from('broadcast_logs').insert([{
        title,
        body,
        created_at: new Date().toISOString()
      }]);

      // -----------------------------------------------------------------------

      return res.json({
        success: true,
        sent: successCount,
        failed: failureCount,
      });

    } catch (err) {
      console.error("Broadcast error:", err);
      return res.status(500).json({ message: "Internal error" });
    }
  }
);

module.exports = router;
