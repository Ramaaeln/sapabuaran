const express = require('express');
const router = express.Router();
const admin = require('../services/firebase'); 
const supabase = require('../utils/supabaseClient');


router.post('/send', async (req, res) => {
  const { userId, title, body } = req.body;

  if (!userId || !title || !body) {
    return res.status(400).json({ message: "Missing fields" });
  }

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (error || !data) {
      return res.status(404).json({ message: "User not found" });
    }

    const token = data.fcm_token;

    if (!token) {
      return res.status(400).json({ message: "User has no FCM token" });
    }

    const message = {
      token,
      notification: {
        title,
        body,
      },
      android: {
        priority: "high",
      },
    };

    await admin.messaging().send(message);

    return res.json({ success: true, message: "Notification sent" });

  } catch (err) {
    console.error("Error sending FCM", err);
    return res.status(500).json({ message: "Internal server error" });
  }
});

router.post('/broadcast', async (req, res) => {
  const { title, body } = req.body;

  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('fcm_token');

    if (error) {
      return res.status(500).json({ message: "DB error" });
    }

    const tokens = data
      .map(u => u.fcm_token)
      .filter(t => t && t.length > 10);

    if (tokens.length === 0) {
      return res.status(400).json({ message: "No tokens available" });
    }

    const message = {
      tokens,
      notification: { title, body },
    };

    const response = await admin.messaging().sendMulticast(message);

    return res.json({
      success: true,
      sent: response.successCount,
      failed: response.failureCount,
    });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: "Internal error" });
  }
});

module.exports = router;
