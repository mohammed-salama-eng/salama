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

const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Robust Fetch with Timeout, Retry, and Exponential Backoff
 */
async function fetchWithRetry(url, retries = 3, backoff = 2000, timeout = 10000) {
  for (let i = 0; i < retries; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);

      if (!response.ok) {
        if (response.status === 429) {
          console.warn(`⚠️ Rate limited (429). Waiting ${backoff * 2}ms...`);
          await delay(backoff * 2);
        }
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (err) {
      clearTimeout(timer);
      const isLast = i === retries - 1;
      const errorType = err.name === 'AbortError' ? 'Timeout' : err.message;

      if (isLast) throw new Error(`${errorType} after ${retries} attempts`);

      console.warn(`🔄 ${errorType}. Retrying in ${backoff}ms... (${i + 1}/${retries})`);
      await delay(backoff);
      backoff *= 2; // Exponential increase
    }
  }
}

async function processLocation(locationObj) {
  const { locality_en, state_en, centroid } = locationObj;
  const latitude = centroid.lat;
  const longitude = centroid.lng;

  // Formatting locality keys consistently
  const locality = `${locality_en}_${state_en}`.toLowerCase().trim().replaceAll(" ", "_");
  const locationName = `${locality_en}_${state_en}`.toLowerCase().trim().replaceAll(" ", "_");

  try {
    const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&hourly=apparent_temperature,precipitation,uv_index,wind_speed_10m,wind_gusts_10m,relative_humidity_2m` +
      `&timezone=Africa/Khartoum&wind_speed_unit=ms&forecast_days=3`;

    const healthUrl = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
      `&daily=temperature_2m_max,temperature_2m_min,precipitation_sum,wind_speed_10m_max,shortwave_radiation_sum,relative_humidity_2m_mean,pressure_msl_mean,weather_code,apparent_temperature_mean` +
      `&timezone=Africa/Khartoum&wind_speed_unit=ms&forecast_days=3`;

    // Use our robust helper
    const weatherData = await fetchWithRetry(weatherUrl);
    const healthData = await fetchWithRetry(healthUrl);

    const weatherAlerts = weatherLogic(weatherData, locationName);
    const healthRisks = calculateHealthRisks(healthData);

    // --- ALERTS ---
    if (!weatherAlerts || weatherAlerts.length === 0) {
      const alertId = `${locality}_noAlert`;
      await db.collection("alerts").doc(alertId).set({
        location: locality,
        alertType: "noAlert",
        updatedAt: Date.now()
      }, { merge: true });
    } else {
      for (const alert of weatherAlerts) {
        // Shared Notification Config
        const notificationConfig = {
          android: {
            ttl: 24 * 60 * 60 * 1000,
            priority: "high",
            collapseKey: "weather_alert"
          },
          apns: {
            headers: {
              "apns-expiration": Math.floor(Date.now() / 1000 + 86400).toString(),
              "apns-priority": "10"
            }
          }
        };

        // 🔔 English Notification
        await messaging.send({
          topic: `${locality}_en`,
          notification: alert.notification,
          ...notificationConfig
        });

        // 🔔 Arabic Notification
        await messaging.send({
          topic: `${locality}_ar`,
          notification: alert.notificationAr,
          ...notificationConfig
        });

        // 💾 Store Alert
        const alertId = `${locality}_${alert.type}`;
        await db.collection("alerts").doc(alertId).set({
          location: locality,
          ...alert, // Spread alert properties
          createdAt: Date.now()
        }, { merge: true });
      }
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
    
    // Constant delay to prevent burst limit issues
    await delay(1000);

  } catch (err) {
    console.error(`❌ Permanent Failure for ${locality}:`, err.message);
  }
}

async function run() {
  console.log(`🚀 Starting sync for ${locations.length} localities...`);
  for (const location of locations) {
    await processLocation(location);
  }
  console.log("🏁 All localities processed.");
}

run();
