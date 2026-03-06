const admin = require("firebase-admin");
const weatherLogic = require("./weather");
const dustLogic = require("./dust_storms");


const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

admin.initializeApp({
credential: admin.credential.cert(serviceAccount)
});

const messaging = admin.messaging();

async function run() {
    const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}` +
    `&daily=apparent_temperature_max,apparent_temperature_min,precipitation_sum,uv_index_max,wind_speed_10m_max,wind_gusts_10m_max` +
    `&hourly=wind_speed_10m,wind_gusts_10m,relative_humidity_2m,dew_point_2m,visibility,temperature_2m,shortwave_radiation` +
    `&timezone=auto&wind_speed_unit=ms&forecast_days=7`
        );

    const weatherData = await weatherResponse.json();
    const alerts = weatherLogic(weatherData, "ad_dabbah_Northern");

    for (const alert of alerts) {
        await messaging.send({
            topic: "ad_dabbah_Northern",
            notification: alert
        });

    }

}

run();





