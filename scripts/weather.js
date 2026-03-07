const APPARENT_HEATWAVE_THRESHOLD = 44;
const APPARENT_COLDWAVE_THRESHOLD = 15;
const UV_INDEX_MODERATE_THRESHOLD = 8.5;
const UV_INDEX_HIGH_THRESHOLD = 9;
const STRONG_WIND_THRESHOLD = 6;
const GUST_WIND_THRESHOLD = 12;
const HEAVY_RAIN_THRESHOLD = 4;
const HIGH_HUMIDITY_THRESHOLD = 80;

module.exports = function processWeatherData(data, locationName) {

  const alerts = [];
  const added = new Set();

  const {
    time,
    apparent_temperature_max,
    apparent_temperature_min,
    precipitation_sum,
    uv_index_max,
    wind_speed_10m_max,
    wind_gusts_10m_max
  } = data.daily;

  // Heatwave detection
  let consecutive = 0;

  for (let i = 0; i < time.length; i++) {

    if (apparent_temperature_max[i] > APPARENT_HEATWAVE_THRESHOLD) {
      consecutive++;
    } else {
      consecutive = 0;
    }

    if (consecutive >= 3 && !added.has("heatwave")) {
      alerts.push({
        title: "Heatwave Alert",
        body: "Extreme heat expected in your location for multiple days.",
        icon: "wb_sunny",
        issuer: "alerts.heatwave.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: time,
        urgency: "high",
        articleUrl: "/articles/heatwaves",
      });
      added.add("heatwave");
    }
  }

  // Coldwave
  consecutive = 0;

  for (let i = 0; i < time.length; i++) {

    if (apparent_temperature_min[i] < APPARENT_COLDWAVE_THRESHOLD) {
      consecutive++;
    } else {
      consecutive = 0;
    }

    if (consecutive >= 3 && !added.has("coldwave")) {
      alerts.push({
        title: "Coldwave Alert ❄️",
        body: "Cold conditions expected in your location.",
        icon: "ac_unit",
        issuer: "alerts.coldwave.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: time,
        urgency: "high",
        articleUrl: "/articles/coldwaves"
      });
      added.add("coldwave");
    }
  }

  for (let i = 0; i < time.length; i++) {

    if (precipitation_sum[i] >= HEAVY_RAIN_THRESHOLD && !added.has("rain")) {
      alerts.push({
        title: "Heavy Rain Warning",
        body: "Heavy rainfall expected in your location.",
        icon: "rainy",
        issuer: "alerts.rainAlert.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: time,
        urgency: "high",
        articleUrl: "/articles/rains",
      
      });
      added.add("rain");
    }

    if (uv_index_max[i] >= UV_INDEX_HIGH_THRESHOLD && !added.has("uv")) {
      alerts.push({
        title: "Extreme UV Warning",
        body: "Very high UV index expected in your location.",
        icon: "flare",
        issuer: "alerts.uvIndex.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: time,
        urgency: "high",
        articleUrl: "/articles/heatwaves",
      
      });
      added.add("uv");
    }

    const strongWind = wind_speed_10m_max[i] > STRONG_WIND_THRESHOLD;
    const strongGust =
      wind_gusts_10m_max && wind_gusts_10m_max[i] > GUST_WIND_THRESHOLD;

    if (strongWind && !added.has("wind")) {

      alerts.push({
        title: strongGust ? "Strong Wind Alert 💨" : "Wind Advisory 💨",
        body: "Strong winds expected in your location.",
        icon: "air",
        issuer: "alerts.strongWind.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: time,
        urgency: "high",
        articleUrl: "/articles/sandstorms",
      
      });

      added.add("wind");
    }
  }

  if (data.hourly?.relative_humidity_2m) {

    const humidity = data.hourly.relative_humidity_2m.slice(0, 24);

    const avg =
      humidity.reduce((sum, v) => sum + v, 0) / humidity.length;

    if (avg > HIGH_HUMIDITY_THRESHOLD && !added.has("humidity")) {

      alerts.push({
        title: "High Humidity Warning 💧",
        body: "Very humid conditions expected in your location.",
        icon: "water_drop",
        issuer: "alerts.highHumidity.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: time,
        urgency: "high",
        articleUrl: "/articles/humidity",
      
      });

      added.add("humidity");
    }
  }

  return alerts;
};
