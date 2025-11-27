const admin = require('firebase-admin');
const serviceAccount = require('../utils/firebaseAdmin');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

async function sendNotification(fcmToken, title, body, data = {}) {
  const message = {
    token: fcmToken,
    notification: { title, body },
    data
  };

  return await admin.messaging().send(message);
}

module.exports = { sendNotification };
