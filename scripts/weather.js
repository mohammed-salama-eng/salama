const formatDateEn = (date, lang) => {
  // DAY
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // TIME
  let time;
  const hour = Number(date.getHours()) + 1;

  if (hour >= 0 && hour < 5) time = "early morning";
  else if (hour >= 5 && hour < 12) time = "morning";
  else if (hour >= 12 && hour < 15) time = "noon";
  else if (hour >= 15 && hour < 18) time = "after noon";
  else if (hour >= 18 && hour < 20) time = "evening";
  else time = "night";

  if (date.toDateString() === today.toDateString()) {
    return "this "  + time;
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return "tomorrow " + time;
  }
  if (date.toDateString() === afterTomorrow.toDateString()) {
    return "after tomorrow " + time;
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return "yesterday " + time;
  }
  return i18n.language === "ar"
    ? time + " " + date.toLocaleDateString(lang, { weekday: "long" })
    : date.toLocaleDateString(lang, { weekday: "long" }) + " " + time;
};


const formatDateAr = (date, lang) => {
  // DAY
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const afterTomorrow = new Date(today);
  afterTomorrow.setDate(afterTomorrow.getDate() + 2);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // TIME
  let time;
  const hour = Number(date.getHours()) + 1;

  if (hour >= 0 && hour < 5) time = "فجر";
  else if (hour >= 5 && hour < 12) time = "صباح";
  else if (hour >= 12 && hour < 15) time = "ظهر";
  else if (hour >= 15 && hour < 18) time = "عصر";
  else if (hour >= 18 && hour < 20) time = "مساء";
  else time = "ليلة";

  if (date.toDateString() === today.toDateString()) {
    return time + " " + "اليوم";
  }
  if (date.toDateString() === tomorrow.toDateString()) {
    return time + " " + "الغد ";
  }
  if (date.toDateString() === afterTomorrow.toDateString()) {
    return time + " " + "بعد غد ";
  }
  if (date.toDateString() === yesterday.toDateString()) {
    return time + " " + "الأمس ";
  }
  return time + " " + date.toLocaleDateString(lang, { weekday: "long" })
};





const ALERT_CONFIG = {
  heat: {
    notificationTitle: "Heatwave Alert",
    notificationDescription: "Expect temperatures to rise above 45°C",
    notificationTitleMedium: "Heatwave Advisory",
    notificationDescriptionMedium: "Expect temperatures to rise above 42°C",
    notificationTitleAr: "إنذار موجة حارة",
    notificationDescriptionAr: "من المتوقع أن ترتفع درجات الحرارة إلى 45 درجة مئوية",
    notificationTitleMediumAr: "تنبيه موجة حارة",
    notificationDescriptionMediumAr: "من المتوقع أن ترتفع درجات الحرارة إلى 42 درجة مئوية",
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
    icon: "ac_unit",
    notificationTitle: "Coldwave Alert",
    notificationDescription: "Expect temperatures to drop below 12°C",
    notificationTitleMedium: "Coldwave Advisory",
    notificationDescriptionMedium: "Expect temperatures to drop below 15°C",
    notificationTitleAr: "إنذار موجة باردة",
    notificationDescriptionAr: "من المتوقع أن تنخفض درجات الحرارة تحت 12 درجة مئوية",
    notificationTitleMediumAr: "تنبيه موجة باردة",
    notificationDescriptionMediumAr: "من المتوقع أن تنخفض درجات الحرارة تحت 15 درجة مئوية",
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
    notificationTitle: "Rainfall Alert",
    notificationDescription: "Detected moderate to heavy rain near your location",
    notificationTitleMedium: "Rainfall Advisory",
    notificationDescriptionMedium: "Detected light to moderate rain near your location",
    notificationTitleAr: "إنذار هطول أمطار",
    notificationDescriptionAr: "من المتوقع هطول أمطار بين متوسطة إلى غزيرة بالقرب من موقعك",
    notificationTitleMediumAr: "تنبيه هطول أمطار",
    notificationDescriptionMediumAr: "من المتوقع هطول أمطار بين خفيفة إلى متوسطة بالقرب من موقعك",
    articleUrl: "/articles/rains",
    issuer: "alerts.rainAlert.issuer",
    key: "alerts.rainAlert",
    medium: 1,
    high: 4,
    minDuration: 2,
    comparator: (v, t) => v >= t
  },
  uv: {
    icon: "flare",
    notificationTitle: "High UV Alert",
    notificationDescription: "Detected moderate to heavy UV index near your location",
    notificationTitleMedium: "Moderate UV Advisory",
    notificationDescriptionMedium: "Detected light to moderate UV index near your location",
    notificationTitleAr: "إنذار أشعة ضارة",
    notificationDescriptionAr: "تم رصد مستويات أشعة شمس بين متوسطة إلى كثيفة بالقرب من موقعك",
    notificationTitleMediumAr: "تنبيه أشعة ضارة",
    notificationDescriptionMediumAr: "تم رصد مستويات أشعة شمس ضارة بين خفيفة إلى متوسطة بالقرب من موقعك",
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
    notificationTitle: "High Humidity Alert",
    notificationDescription: "Detected moderate to heavy humidity levels near your location",
    notificationTitleMedium: "Moderate Humidity Advisory",
    notificationDescriptionMedium: "Detected light to moderate humidity levels near your location",
    notificationTitleAr: "إنذار رطوبة عالية",
    notificationDescriptionAr: "تم رصد مستويات رطوبة بين متوسطة إلى كثيفة بالقرب من موقعك",
    notificationTitleMediumAr: "تنبيه رطوبة متوسطة",
    notificationDescriptionMediumAr: "تم رصد مستويات رطوبة بين خفيفة إلى متوسطة بالقرب من موقعك",
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
    notificationTitle: "Wind Alert",
    notificationDescription: "Detected moderate to heavy winds near your location",
    notificationTitleMedium: "Moderate Wind Advisory",
    notificationDescriptionMedium: "Detected light to moderate winds near your location",
    notificationTitleAr: "إنذار رياح قوية",
    notificationDescriptionAr: "تم رصد سرعات رياح بين متوسطة إلى شديدة بالقرب من موقعك",
    notificationTitleMediumAr: "تنبيه نشاط رياح",
    notificationDescriptionMediumAr: "تم رصد سرعات رياح بين خفيفة إلى متوسطة بالقرب من موقعك",
    articleUrl: "/articles/sandstorms",
    issuer: "alerts.strongWind.issuer",
    key: "alerts.strongWind",
    threshold: 6.5,
    gustThreshold: 15,
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
          title: severity === "high" ? config.notificationTitle : config.notificationTitleMedium,
          body: severity === "high" ? config.notificationDescription + " " + formatDateEn(new Date(time[tracker.start])) : config.notificationDescriptionMedium + " " + formatDateEn(new Date(time[tracker.start])),
        },
        notificationAr: {
          title: severity === "high" ? config.notificationTitleAr : config.notificationTitleMediumAr,
          body: severity === "high" ? config.notificationDescriptionAr + " " + formatDateAr(new Date(time[tracker.start])) : config.notificationDescriptionMediumAr + " " + formatDateAr(new Date(time[tracker.start])),
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
        startTimestamp: new Date(time[tracker.start] + ":00+02:00").getTime,
        endTimestamp: new Date(time[endIndex] + ":00+02:00").getTime,
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
