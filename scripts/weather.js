// weather.js

const ALERT_CONFIG = {
  heat: {
    icon: "wb_sunny",
    articleUrl: "/articles/heatwaves",
    issuer: "alerts.heatwave.issuer",
    key: "alerts.heatwave",
    medium: 42,
    high: 44,
    minDuration: 3,
    comparator: (v, t) => v > t
  },
  cold: {
    icon: "ac_unit",
    articleUrl: "/articles/coldwave",
    issuer: "alerts.coldwave.issuer",
    key: "alerts.coldwave",
    medium: 15,
    high: 12,
    minDuration: 3,
    comparator: (v, t) => v < t
  },
  rain: {
    icon: "rainy",
    articleUrl: "/articles/rains",
    issuer: "alerts.rainAlert.issuer",
    key: "alerts.rainAlert",
    medium: 2,
    high: 4,
    minDuration: 2,
    comparator: (v, t) => v >= t
  },
  uv: {
    icon: "flare",
    articleUrl: "/articles/heatwaves",
    issuer: "alerts.uvIndex.issuer",
    key: "alerts.uvIndex",
    medium: 8.5,
    high: 9,
    minDuration: 2,
    comparator: (v, t) => v >= t
  },
  humidity: {
    icon: "water_drop",
    articleUrl: "/articles/humidity",
    issuer: "alerts.highHumidity.issuer",
    key: "alerts.highHumidity",
    medium: 60,
    high: 80,
    minDuration: 3,
    comparator: (v, t) => v >= t
  },
  wind: {
    icon: "air",
    articleUrl: "/articles/sandstorms",
    issuer: "alerts.strongWind.issuer",
    key: "alerts.strongWind",
    threshold: 7,
    gustThreshold: 12
  }
};

module.exports = function processWeatherData(data, locationName) {

  const alerts = [];
  const added = new Set();

  const { time, apparent_temperature, precipitation, uv_index,
          relative_humidity_2m, wind_speed_10m, wind_gusts_10m } = data.hourly;

  const eventTrackers = {
    heat: { start: null, peak: null, duration: 0 },
    cold: { start: null, peak: null, duration: 0 },
    rain: { start: null, peak: null, duration: 0 },
    uv: { start: null, peak: null, duration: 0 },
    humidity: { start: null, peak: null, duration: 0 }
  };

  for (let i = 0; i < time.length; i++) {

    const hourData = {
      heat: apparent_temperature[i],
      cold: apparent_temperature[i],
      rain: precipitation[i],
      uv: uv_index[i],
      humidity: relative_humidity_2m?.[i] ?? null
    };

    // --- Event Detection for each alert type ---
    for (const type of Object.keys(eventTrackers)) {

      const config = ALERT_CONFIG[type];
      const tracker = eventTrackers[type];
      const value = hourData[type];

      if (value === null) continue;

      if (config.comparator(value, config.medium)) {

        if (tracker.start === null) tracker.start = i;
        tracker.duration++;
        tracker.peak = tracker.peak === null
          ? value
          : (type === "cold" ? Math.min(tracker.peak, value) : Math.max(tracker.peak, value));

      } else {

        if (tracker.start !== null && tracker.duration >= config.minDuration) {
          // classify and create alert
          const severity = (type === "cold" ? tracker.peak <= config.high : tracker.peak >= config.high)
                            ? "high" : "medium";

          if (!added.has(type)) {
            alerts.push({
              notification: { title: `${type} alert`, body: "Weather alert in your location." },
              title: severity === "high" ? `${config.key}.title` : `${config.key}.mediumTitle`,
              description: severity === "high" ? `${config.key}.description` : `${config.key}.mediumDescription`,
              type,
              icon: config.icon,
              issuer: config.issuer,
              articleUrl: config.articleUrl,
              location: locationName,
              time: time[tracker.start],
              urgency: severity,
              showMore: "alerts.showMore"
            });
            added.add(type);
          }
        }

        tracker.start = null;
        tracker.peak = null;
        tracker.duration = 0;
      }
    }

    // --- Wind Logic (unchanged) ---
    const windConfig = ALERT_CONFIG.wind;
    const strongWind = wind_speed_10m[i] > windConfig.threshold;
    const strongGust = wind_gusts_10m?.[i] > windConfig.gustThreshold;

    if (strongWind && !added.has("wind")) {
      alerts.push({
        notification: {
          title: strongGust ? "Strong Wind Alert 💨" : "Wind Advisory 💨",
          body: "Strong winds expected in your location."
        },
        title: "alerts.strongWind.title",
        description: "alerts.strongWind.description",
        type: "wind",
        icon: windConfig.icon,
        issuer: windConfig.issuer,
        articleUrl: windConfig.articleUrl,
        location: locationName,
        time: time[i],
        urgency: "high",
        showMore: "alerts.showMore"
      });
      added.add("wind");
    }
  }

  // --- Final check for ongoing events at the end of forecast ---
  for (const type of Object.keys(eventTrackers)) {
    const tracker = eventTrackers[type];
    const config = ALERT_CONFIG[type];
    if (tracker.start !== null && tracker.duration >= config.minDuration && !added.has(type)) {
      const severity = (type === "cold" ? tracker.peak <= config.high : tracker.peak >= config.high)
                        ? "high" : "medium";

      alerts.push({
        notification: { title: `${type} alert`, body: "Weather alert in your location." },
        title: severity === "high" ? `${config.key}.title` : `${config.key}.mediumTitle`,
        description: severity === "high" ? `${config.key}.description` : `${config.key}.mediumDescription`,
        type,
        icon: config.icon,
        issuer: config.issuer,
        articleUrl: config.articleUrl,
        location: locationName,
        time: time[tracker.start],
        urgency: severity,
        showMore: "alerts.showMore"
      });
      added.add(type);
    }
  }

  return alerts;
};
