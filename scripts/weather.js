const ALERT_CONFIG = {
  heat: {
    typeAr: "موجة حر",
    notificationTitle: "Heatwave Alert",
    notificationDescription: "Expect temperatures to rise above 45°C",
    notificationTitleMedium: "Heatwave Advisory",
    notificationDescription: "Expect temperatures to rise above 42°C",
    notificationTitleAr: "إنذار موجة حارة",
    notificationDescriptionAr: "من المتوقع أن ترتفع درجات الحرارة إلى 45 درجة مئوية",
    notificationTitleMediumAr: "تنبيه موجة حارة",
    notificationDescriptionAr: "من المتوقع أن ترتفع درجات الحرارة إلى 42 درجة مئوية",
    icon: "wb_sunny",
    articleUrl: "/articles/heatwaves",
    issuer: "alerts.heatwave.issuer",
    key: "alerts.heatwave",
    medium: 42,
    high: 45,
    minDuratin: 3,
    comparator: (v, t) => v > t
  },
  cold: {
    typeAr: "موجة برد",
    icon: "ac_unit",
    notificationTitle: "Coldwave Alert",
    notificationDescription: "Expect temperatures to drop below 12°C",
    notificationTitleMedium: "Coldwave Advisory",
    notificationDescription: "Expect temperatures to drop below 15°C",
    notificationTitleAr: "إنذار موجة باردة",
    notificationDescriptionAr: "من المتوقع أن تنخفض درجات الحرارة تحت 12 درجة مئوية",
    notificationTitleMediumAr: "تنبيه موجة باردة",
    notificationDescriptionAr: "من المتوقع أن تنخفض درجات الحرارة تحت 15 درجة مئوية",
    articleUrl: "/articles/coldwave",
    issuer: "alerts.coldwave.issuer",
    key: "alerts.coldwave",
    medium: 15,
    high: 12,
    minDuration: 3,
    comparator: (v, t) => v < t
  },
  rain: {
    typeAr: "هطول أمطار",
    icon: "rainy",
    notificationTitle: "Rainfall Alert",
    notificationDescription: "Detected moderate to heavy rain near your location",
    notificationTitleMedium: "Rainfall Advisory",
    notificationDescription: "Detected light to moderate rain near your location",
    notificationTitleAr: "إنذار هطول أمطار",
    notificationDescriptionAr: "من المتوقع هطول أمطار بين متوسطة إلى غزيرة بالقرب من موقعك",
    notificationTitleMediumAr: "تنبيه هطول أمطار",
    notificationDescriptionAr: "من المتوقع هطول أمطار بين خفيفة إلى متوسطة بالقرب من موقعك",
    articleUrl: "/articles/rains",
    issuer: "alerts.rainAlert.issuer",
    key: "alerts.rainAlert",
    medium: 2,
    high: 4,
    minDuration: 2,
    comparator: (v, t) => v >= t
  },
  uv: {
    typeAr: "أشعة ضارة",
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
    typeAr: "رطوبة عالية",
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
    typeAr: "هبوب رياح",
    icon: "air",
    articleUrl: "/articles/sandstorms",
    issuer: "alerts.strongWind.issuer",
    key: "alerts.strongWind",
    threshold: 6.5,
    gustThreshold: 12,
    minDuration: 2
  }
};

module.exports = function processWeatherData(data, locationName) {

  const alerts = [];
  const added = new Set();

  const {
    time,
    apparent_temperature,
    precipitation,
    uv_index,
    relative_humidity_2m,
    wind_speed_10m,
    wind_gusts_10m
  } = data.hourly;

  const trackers = {};

  // initialize trackers for ALL types including wind
  Object.keys(ALERT_CONFIG).forEach(type => {
    trackers[type] = {
      start: null,
      peak: null,
      duration: 0,
      severity: null
    };
  });

  function processEnd(type, endIndex) {
    const tracker = trackers[type];
    const config = ALERT_CONFIG[type];

    if (tracker.start === null) return;

    if (tracker.duration >= config.minDuration && !added.has(type)) {

      const severity = tracker.severity;

      alerts.push({
        notification: {
          title: `${type} alert`,
          body: "Weather alert in your location."
        },
        notificationAr: {
          title: `${config.typeAr}`,
          body: "إنذار بالقرب من منطقتك."
        },
        title: severity === "high"
          ? `${config.key}.title`
          : `${config.key}.titleMedium`,
        description: severity === "high"
          ? `${config.key}.description`
          : `${config.key}.descriptionMedium`,
        type,
        icon: config.icon,
        issuer: config.issuer,
        articleUrl: config.articleUrl,
        location: locationName,
        start: time[tracker.start],
        end: time[endIndex],
        urgency: severity,
        showMore: "alerts.showMore"
      });

      added.add(type);
    }

    // reset
    tracker.start = null;
    tracker.peak = null;
    tracker.duration = 0;
    tracker.severity = null;
  }

  for (let i = 0; i < time.length; i++) {

    // -------- NORMAL ALERTS --------
    const hourData = {
      heat: apparent_temperature[i],
      cold: apparent_temperature[i],
      rain: precipitation[i],
      uv: uv_index[i],
      humidity: relative_humidity_2m?.[i] ?? null
    };

    for (const type of ["heat", "cold", "rain", "uv", "humidity"]) {

      const config = ALERT_CONFIG[type];
      const tracker = trackers[type];
      const value = hourData[type];

      if (value === null) continue;

      const meets = config.comparator(value, config.medium);

      if (meets) {

        if (tracker.start === null) {
          tracker.start = i;
        }

        tracker.duration++;

        // track peak
        tracker.peak = tracker.peak === null
          ? value
          : (type === "cold"
              ? Math.min(tracker.peak, value)
              : Math.max(tracker.peak, value));

        // track severity (highest reached)
        const isHigh = type === "cold"
          ? value <= config.high
          : value >= config.high;

        if (isHigh) tracker.severity = "high";
        else if (!tracker.severity) tracker.severity = "medium";

      } else {
        processEnd(type, i - 1);
      }
    }

    // -------- WIND (NOW IN SAME PATTERN) --------
    const windConfig = ALERT_CONFIG.wind;
    const tracker = trackers.wind;

    const strongWind = wind_speed_10m[i] > windConfig.threshold;
    const strongGust = wind_gusts_10m?.[i] > windConfig.gustThreshold;

    if (strongWind) {

      if (tracker.start === null) {
        tracker.start = i;
      }

      tracker.duration++;

      // severity logic preserved
      if (strongGust) tracker.severity = "high";
      else if (!tracker.severity) tracker.severity = "medium";

    } else {
      processEnd("wind", i - 1);
    }
  }

  // -------- FINALIZE ALL OPEN EVENTS --------
  Object.keys(trackers).forEach(type => {
    if (trackers[type].start !== null) {
      processEnd(type, time.length - 1);
    }
  });

  return alerts;
};
