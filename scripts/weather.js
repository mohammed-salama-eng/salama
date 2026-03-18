const THRESHOLDS = {
  heat: { medium: 42, high: 44, minDuration: 3 },
  cold: { medium: 15, high: 12, minDuration: 3 },
  rain: { medium: 2, high: 4, minDuration: 2 },
  uv: { medium: 8.5, high: 9, minDuration: 2 },
  humidity: { medium: 60, high: 80, minDuration: 3 },
  wind: { speed: 6.5, gust: 12, minDuration: 2 }
};

function getSeverity(value, { medium, high }, type) {
  if (type === "cold") {
    if (value < high) return "high";
    if (value < medium) return "medium";
  } else {
    if (value > high) return "high";
    if (value > medium) return "medium";
  }
  return null;
}

module.exports = function processWeatherData(data, locationName) {

  const alerts = [];
  const added = new Set();

  const {
    time,
    apparent_temperature,
    precipitation,
    uv_index,
    wind_speed_10m,
    wind_gusts_10m,
    relative_humidity_2m
  } = data.hourly;

  const trackers = {
    heat: null,
    cold: null,
    rain: null,
    uv: null,
    humidity: null,
    wind: null
  };

  function startEvent(type, i, severity) {
    trackers[type] = {
      startIndex: i,
      maxSeverity: severity
    };
  }

  function updateEvent(type, severity) {
    if (!trackers[type]) return;

    if (
      severity === "high" ||
      (severity === "medium" && trackers[type].maxSeverity !== "high")
    ) {
      trackers[type].maxSeverity = severity;
    }
  }

  function endEvent(type, i) {
    const tracker = trackers[type];
    if (!tracker) return;

    const duration = i - tracker.startIndex;

    if (duration >= THRESHOLDS[type].minDuration && !added.has(type)) {
      const start = time[tracker.startIndex];
      const end = time[i - 1];

      const isHigh = tracker.maxSeverity === "high";

      alerts.push({
        notification: {
          title: isHigh
            ? `${type} Alert`
            : `alerts.${type}.mediumTitle`,
          body: isHigh
            ? `${type} conditions expected`
            : `alerts.${type}.mediumDescription`
        },
        title: isHigh
          ? `alerts.${type}.title`
          : `alerts.${type}.mediumTitle`,
        description: isHigh
          ? `alerts.${type}.description`
          : `alerts.${type}.mediumDescription`,
        type,
        icon: type,
        issuer: `alerts.${type}.issuer`,
        showMore: "alerts.showMore",
        location: locationName,
        start,
        end,
        urgency: isHigh ? "high" : "medium"
      });

      added.add(type);
    }

    trackers[type] = null;
  }

  for (let i = 0; i < time.length; i++) {

    // ---- HEAT ----
    const heatSeverity = getSeverity(
      apparent_temperature[i],
      THRESHOLDS.heat,
      "heat"
    );

    if (heatSeverity) {
      if (!trackers.heat) startEvent("heat", i, heatSeverity);
      else updateEvent("heat", heatSeverity);
    } else {
      endEvent("heat", i);
    }

    // ---- COLD ----
    const coldSeverity = getSeverity(
      apparent_temperature[i],
      THRESHOLDS.cold,
      "cold"
    );

    if (coldSeverity) {
      if (!trackers.cold) startEvent("cold", i, coldSeverity);
      else updateEvent("cold", coldSeverity);
    } else {
      endEvent("cold", i);
    }

    // ---- RAIN ----
    const rainSeverity = getSeverity(
      precipitation[i],
      THRESHOLDS.rain,
      "rain"
    );

    if (rainSeverity) {
      if (!trackers.rain) startEvent("rain", i, rainSeverity);
      else updateEvent("rain", rainSeverity);
    } else {
      endEvent("rain", i);
    }

    // ---- UV ----
    const uvSeverity = getSeverity(
      uv_index[i],
      THRESHOLDS.uv,
      "uv"
    );

    if (uvSeverity) {
      if (!trackers.uv) startEvent("uv", i, uvSeverity);
      else updateEvent("uv", uvSeverity);
    } else {
      endEvent("uv", i);
    }

    // ---- HUMIDITY ----
    if (relative_humidity_2m) {
      const humiditySeverity = getSeverity(
        relative_humidity_2m[i],
        THRESHOLDS.humidity,
        "humidity"
      );

      if (humiditySeverity) {
        if (!trackers.humidity)
          startEvent("humidity", i, humiditySeverity);
        else updateEvent("humidity", humiditySeverity);
      } else {
        endEvent("humidity", i);
      }
    }

    // ---- WIND (kept behavior but in pattern) ----
    const strongWind = wind_speed_10m[i] > THRESHOLDS.wind.speed;
    const strongGust =
      wind_gusts_10m[i] && wind_gusts_10m[i] > THRESHOLDS.wind.gust;

    if (strongWind) {
      const severity = strongGust ? "high" : "medium";

      if (!trackers.wind) startEvent("wind", i, severity);
      else updateEvent("wind", severity);
    } else {
      endEvent("wind", i);
    }
  }

  // finalize any ongoing events
  Object.keys(trackers).forEach(type => {
    if (trackers[type]) {
      endEvent(type, time.length);
    }
  });

  return alerts;
};
