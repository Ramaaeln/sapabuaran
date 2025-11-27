const admin = require("firebase-admin");
const serviceAccount = require("./serviceAccountKey.json"); // sensor private key

admin.initializeApp({
  credential: admin.credential.cert({
    project_id: serviceAccount.project_id,
    client_email: serviceAccount.client_email,
    private_key: serviceAccount.private_key.replace(/\\n/g, '\n'),
  }),
});

module.exports = admin;