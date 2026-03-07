const admin = require("firebase-admin");

const weatherLogic = require("./weather");
const dustLogic = require("./dust_storms");


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);


admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});

const messaging = admin.messaging();
const db = admin.firestore();

const latitude = 18.0333;
const longitude = 31.2833;
const locality = "ad_dabbah_northern";


async function run() {
    const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=apparent_temperature_max,apparent_temperature_min,precipitation_sum,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max` +
    `&hourly=wind_speed_10m,wind_gusts_10m,relative_humidity_2m,dew_point_2m,visibility,temperature_2m,shortwave_radiation` +
    `&timezone=auto&wind_speed_unit=ms&forecast_days=7`
        );

    const dustResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=pm10,pm2_5,dust,aerosol_optical_depth` +
    `&timezone=auto&forecast_days=3`
);

    const weatherData = await weatherResponse.json();
    const dustData = await dustResponse.json();
    const weatherAlerts = weatherLogic(weatherData, "Ad Dabbah Northern");
    const dustAlerts = dustLogic(weatherData, "Ad Dabbah Northern");

    for (const alert of weatherAlerts) {
        // Push notifications
        await messaging.send({
            topic: locality,
            notification: {
                title: alert.title,
                body: alert.body
            }
        });

       // Store alert to database
       const alertId = `${locality}_${alert.type}_{Date.now()}`;
       await dB.collection("alerts").doc(alertId).set({
               localion: locality,
               type: alert.type,
               title: alert.title,
               description: alert.body,
               time: alert.time,
               urgency: alert.urgency,
               icon: alert.icon,
               articleUrl: alert.articleUrl,
               showMore: alert.showMore,
               createdAt: dB.FiledValue.serverTimestamp(),
               expiresAt: Date.now() + 24 * 60 * 60 * 1000
           }, { merge: true });

    }
    
    for (const alert of dustAlerts) {
        await messaging.send({
            topic: locality,
            notification: alert
        });

    }

}

run();





