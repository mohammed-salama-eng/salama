const admin = require("firebase-admin");

const weatherLogic = require("./weather");
const dustLogic = require("./dust_storms");
const calculateHealthRisks = require("./health_risks")


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
    `&hourly=apparent_temperature,precipitation,uv_index,wind_speed_10m,wind_gusts_10m,relative_humidity_2m` +
    `&timezone=auto&wind_speed_unit=ms&forecast_days=3`
        );

    const dustResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&hourly=pm10,pm2_5,dust,aerosol_optical_depth` +
    `&timezone=auto&forecast_days=3`
);

    const healthResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=temperature,precipitation,wind,humidity,uv,pressureToday,pressureYesterday` +
    `&timezone=auto&wind_speed_unit=ms&forecast_days=1`
        );

    const weatherData = await weatherResponse.json();
    const dustData = await dustResponse.json();
    const healthData = await healthResponse.json();
    const weatherAlerts = weatherLogic(weatherData, "Ad Dabbah Northern");
    const dustAlert = dustLogic(weatherData, "Ad Dabbah Northern");
    const healthRisks = calculateHealthRisks(healthData);


    if (weatherAlerts.length <= 0 && !dustAlert) {
       const alertId = `${locality}_"noAlert`;
        
       await db.collection("alerts").doc(alertId).set({
        title: "alerts.noAlert.title",
        description: "alerts.noAlert.description",
        alertType: "noAlert",
        icon: "check_circle",
        issuer: "alerts.noAlert.issuer",
        showMore: "alerts.showMore",
        location: locality,
        time: "alerts.noAlert.time",
        urgency: "none",
    articleUrl: [
      "/articles/cholera",
       "/articles/coldwave",
      "/articles/dehydration",
      "/articles/fire",
      "/articles/floods",
      "/articles/heatwaves",
      "/articles/humidity",
      "/articles/malaria",
      "/articles/nile",
      "/articles/power",
      "/articles/rains",
      "/articles/sandstorms",
      "/articles/scorpions",
      "/articles/snakes",
    ][Math.floor(Math.random() * 14)],
           }, { merge: true });
      
    }
    

    for (const alert of weatherAlerts) {
        // Push notifications
        await messaging.send({
            topic: locality,
            notification: alert.notification
        });

       // Store alert to database
       const alertId = `${locality}_${alert.type}`;
       await db.collection("alerts").doc(alertId).set({
               location: locality,
               title: alert.title,
               description: alert.description,
               alertType: alert.type,
               time: alert.time,
               urgency: alert.urgency,
               icon: alert.icon,
               articleUrl: alert.articleUrl,
               showMore: alert.showMore,
               issuer: alert.issuer,
               createdAt: Date.now(),
               expiresAt: Date.now() + 24 * 60 * 60 * 1000
           }, { merge: true });

    }
    
    if(dustAlert) {
        await messaging.send({
            topic: locality,
            notification: dustAlert
        });

    }

    if(healthRisks) {
        const healthRisksId = `${locality}_health_risks`;
       await db.collection("health").doc(healthRisksId).set({
               location: locality,
               flu: healthRisks.flu,
               infection: healthRisks.infection,
               migraine: healthRisks.migraine,
               dehydration: healthRisks.dehydration,
               heatIllness: healthRisks.heatIllness,
               mosquito: healthRisks.mosquito,
               houseflies: healthRisks.houseflies,
               createdAt: Date.now(),
               expiresAt: Date.now() + 24 * 60 * 60 * 1000
           }, { merge: true });

    }
    
}

run();





