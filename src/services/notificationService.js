const admin = require('./firebase'); 
const supabase = require('../utils/supabaseClient');

async function createAndSendNotification(userId, title, body, meta = {}) {
  try {
    await supabase
      .from('user_notifications')
      .insert([{
        user_id: userId,
        title,
        body,
        is_read: false,
        created_at: new Date().toISOString()
      }]);

    const { data: profile } = await supabase
      .from('profiles')
      .select('fcm_token')
      .eq('id', userId)
      .single();

    if (!profile || !profile.fcm_token) {
      console.log("⚠ User tidak punya FCM token.");
      return;
    }

    const message = {
      token: profile.fcm_token,
      notification: { title, body },
      data: Object.fromEntries(
        Object.entries(meta).map(([k, v]) => [k, String(v)])    
      )
    };

    const send = await admin.messaging().send(message);
    console.log("📨 Notif dikirim:", send);

    return send;

  } catch (err) {
    console.error("Notif gagal:", err);
  }
}

module.exports = { createAndSendNotification };
