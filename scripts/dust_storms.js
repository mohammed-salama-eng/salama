module.exports = function getDustStormWarning(weather, airQuality, locationName) {

  if (!weather.hourly || !airQuality.hourly) return null;

  const wind = weather.hourly.wind_speed_10m.slice(0,24);
  const gust = weather.hourly.wind_gusts_10m.slice(0,24);
  const humidity = weather.hourly.relative_humidity_2m.slice(0,24);
  const visibility = weather.hourly.visibility.slice(0,24);

  const pm10 = airQuality.hourly.pm10.slice(0,24);
  const dust = airQuality.hourly.dust.slice(0,24);

  let bestScore = 0;

  for (let i = 0; i < wind.length; i++) {

    let score = 0;

    if (wind[i] >= 15) score += 2;
    if (wind[i] >= 20) score += 3;

    if (gust[i] >= 20) score += 1;
    if (gust[i] >= 25) score += 2;

    if (humidity[i] <= 30) score += 1;

    if (pm10[i] >= 400) score += 2;
    if (dust[i] >= 500) score += 3;

    if (visibility[i] / 1000 <= 2) score += 3;

    if (score > bestScore) bestScore = score;
  }

  if (bestScore >= 9) {
    return {
      title: "Dust Storm Warning 🌪️",
      body: `High risk of dust storms in ${locationName}.`
    };
  }

  if (bestScore >= 5) {
    return {
      title: "Dust Storm Risk 🌪️",
      body: `Possible dust storms in ${locationName}.`
    };
  }

  return null;
};
