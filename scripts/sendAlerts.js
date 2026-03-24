const admin = require("firebase-admin");
const weatherLogic = require("./weather");
const calculateHealthRisks = require("./health_risks");

const locations = require("./localities_centroids.json");

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const messaging = admin.messaging();
const db = admin.firestore();

async function processLocation(locationObj) {
  const { locality_en, state, centroid } = locationObj;

  const latitude = centroid.lat;
  const longitude = centroid.lng;

  const locality = `${locality_en}_${state}`;
  const locationName = `${locality_en.replace("_", " ")} ${state}`;

  try {
    const weatherResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&hourly=apparent_temperature,precipitation,uv_index,wind_speed_10m,wind_gusts_10m,relative_humidity_2m` +
      `&timezone=Africa/Khartoum&wind_speed_unit=ms&forecast_days=3`
    );

    const healthResponse = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,shortwave_radiation_sum,relative_humidity_2m_mean,pressure_msl_mean,weather_code,apparent_temperature_mean` +
      `&timezone=Africa/Khartoum&wind_speed_unit=ms&forecast_days=3`
    );

    const weatherData = await weatherResponse.json();
    const healthData = await healthResponse.json();

    const weatherAlerts = weatherLogic(weatherData, locationName);
    const healthRisks = calculateHealthRisks(healthData);

    // --- ALERTS ---
    if (!weatherAlerts || weatherAlerts.length === 0) {
      const alertId = `${locality}_noAlert`;

      await db.collection("alerts").doc(alertId).set({
        location: locality,
        alertType: "noAlert",
        createdAt: Date.now()
      }, { merge: true });
    }

    for (const alert of weatherAlerts) {

      // 🔔 Notifications
      await messaging.send({
        topic: `${locality}_en`,
        notification: alert.notification
      });

      await messaging.send({
        topic: `${locality}_ar`,
        notification: alert.notificationAr
      });

      // 💾 Store alert
      const alertId = `${locality}_${alert.type}`;

      await db.collection("alerts").doc(alertId).set({
        location: locality,
        title: alert.title,
        description: alert.description,
        alertType: alert.type,
        start: alert.start,
        startTimestamp: alert.startTimestamp,
        end: alert.end,
        endTimestamp: alert.endTimestamp,
        urgency: alert.urgency,
        icon: alert.icon,
        articleUrl: alert.articleUrl,
        showMore: alert.showMore,
        issuer: alert.issuer,
        createdAt: Date.now()
      }, { merge: true });
    }

    // --- HEALTH ---
    if (healthRisks) {
      const healthRisksId = `${locality}_health_risks`;

      await db.collection("health").doc(healthRisksId).set({
        location: locality,
        weather: healthData,
        risks: healthRisks,
        createdAt: Date.now(),
        expiresAt: Date.now() + 24 * 60 * 60 * 1000
      }, { merge: true });
    }

    console.log(`✅ Processed: ${locality}`);

  } catch (err) {
    console.error(`❌ Error processing ${locality}`, err);
  }
}

async function run() {
  for (const location of locations) {
    await processLocation(location);
  }
}

run();
