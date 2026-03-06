const admin = require("Firebase-admin");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
credential: admin.credential.cert(serviceAccount);
});

const messaging = admin.messaging();

async function sendNotification() {
    await messaging.send({
         topic: "AdDabbahNorthern",
         notification: {
           title: "GitHub Action Test",
           body: "This notification was sent from GitHub Actions",
         },
    });

  console.log("Notification sent!");

}

sendNotification();





