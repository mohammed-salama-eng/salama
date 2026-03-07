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
      const date = new Date(time[i]);

    } else {
      consecutive = 0;
    }

    if (consecutive >= 3 && !added.has("heatwave")) {
      alerts.push({
        notification: {
        title: "Heatwave Alert",
        body: "Extreme heat expected in your location for multiple days.",
        },
        title: "alerts.heatwave.title",
        description: "alerts.heatwave.description",
        icon: "wb_sunny",
        issuer: "alerts.heatwave.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: date,
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
      const date = new Date(time[i]);

    } else {
      consecutive = 0;
    }

    if (consecutive >= 3 && !added.has("coldwave")) {
      alerts.push({
        notification: {
        title: "Coldwave Alert ❄️",
        body: "Cold conditions expected in your location.",
        },
        title: "alerts.coldwave.title",
        description: "alerts.coldwave.description",
        icon: "ac_unit",
        issuer: "alerts.coldwave.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: date,
        urgency: "high",
        articleUrl: "/articles/coldwaves"
      });
      added.add("coldwave");
    }
  }

  for (let i = 0; i < time.length; i++) {

    if (precipitation_sum[i] >= HEAVY_RAIN_THRESHOLD && !added.has("rain")) {
          const date = new Date(time[i]);

      alerts.push({
        notification: {
        title: "Heavy Rain Warning",
        body: "Heavy rainfall expected in your location.",
        },
        title: "alerts.rainAlert.title",
        description: "alerts.rainAlert.description",
        icon: "rainy",
        issuer: "alerts.rainAlert.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: date,
        urgency: "high",
        articleUrl: "/articles/rains",
      
      });
      added.add("rain");
    }

    if (uv_index_max[i] >= UV_INDEX_HIGH_THRESHOLD && !added.has("uv")) {
          const date = new Date(time[i]);

      alerts.push({
        notification: {
          
        title: "Extreme UV Warning",
        body: "Very high UV index expected in your location.",
        },
        title: "alerts.uvIndex.title",
        description: "alerts.uvIndex.description",
        icon: "flare",
        issuer: "alerts.uvIndex.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: date,
        urgency: "high",
        articleUrl: "/articles/heatwaves",
      
      });
      added.add("uv");
    }

    const strongWind = wind_speed_10m_max[i] > STRONG_WIND_THRESHOLD;
    const strongGust =
      wind_gusts_10m_max && wind_gusts_10m_max[i] > GUST_WIND_THRESHOLD;

    if (strongWind && !added.has("wind")) {
      const date = new Date(time[i]);

      alerts.push({
        notification: {
        title: strongGust ? "Strong Wind Alert 💨" : "Wind Advisory 💨",
        body: "Strong winds expected in your location.",
        },
        title: "alerts.strongWind.title",
        description: "alerts.strongWind.description",
        icon: "air",
        issuer: "alerts.strongWind.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: date,
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
        const date = new Date(time[i]);

      alerts.push({
        notification: {
        title: "High Humidity Warning 💧",
        body: "Very humid conditions expected in your location.",
        },
        
        title: "alerts.highHumidity.title",
        description: "alerts.highHumidity.description",
        icon: "water_drop",
        issuer: "alerts.highHumidity.issuer",
        showMore: "alerts.showMore",
        location: locationName,
        time: date,
        urgency: "high",
        articleUrl: "/articles/humidity",
      
      });

      added.add("humidity");
    }
  }

  return alerts;
};
