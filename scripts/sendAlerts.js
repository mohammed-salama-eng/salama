const admin = require("firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});

const messaging = admin.messaging();

async function sendNotification() {
    await messaging.send({
         topic: "ad_dabbah_northern",
         notification: {
           title: "GitHub Action Test",
           body: "This notification was sent from GitHub Actions",
         },
    });

  console.log("Notification sent!");

}

sendNotification();





