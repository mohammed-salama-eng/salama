function clamp(v, min = 0, max = 100) {
  if (isNaN(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

function safe(v, fallback = 0) {
  return (v === undefined || v === null || isNaN(v)) ? fallback : v;
}

function riskLevel(score) {
  if (score < 20) return "very_low";
  if (score < 40) return "low";
  if (score < 60) return "moderate";
  if (score < 80) return "high";
  return "very_high";
}

module.exports = function calculateHealthRisks(weather) {

  const tempMax = safe(weather.temperature_2m_max);
  const tempMin = safe(weather.temperature_2m_min);
  const tempAvg = (tempMax + tempMin) / 2;

  const humidity = safe(weather.relative_humidity_2m_mean, 50);
  const wind = safe(weather.wind_speed_10m_max);
  const precipitation = safe(weather.precipitation_sum);
  const uv = safe(weather.uv_index_max);

  const pressureToday = safe(weather.pressure_msl_mean, 1010);
  const pressureYesterday = safe(weather.pressure_msl_mean_prev, pressureToday);

  const pressureChange = Math.abs(pressureToday - pressureYesterday);

  /* ---------------- MOSQUITO ACTIVITY ---------------- */

  let tempScore;

  if (tempAvg < 10) tempScore = 0;
  else if (tempAvg < 18) tempScore = 25;
  else if (tempAvg < 25) tempScore = 70;
  else if (tempAvg < 32) tempScore = 100;
  else if (tempAvg < 38) tempScore = 75;
  else tempScore = 40;

  const humidityScore = clamp((humidity - 40) * 1.8);

  let rainScore = 10;
  if (precipitation > 6) rainScore = 90;
  else if (precipitation > 2) rainScore = 50;

  let windPenalty = 0;
  if (wind > 30) windPenalty = -40;
  else if (wind > 18) windPenalty = -20;

  const mosquitoScore = clamp(
    0.45 * tempScore +
    0.35 * humidityScore +
    0.15 * rainScore +
    windPenalty
  );

  /* ---------------- HOUSEFLY ACTIVITY ---------------- */

  if (tempAvg < 10) tempScore = 0;
  else if (tempAvg < 18) tempScore = 40;
  else if (tempAvg < 25) tempScore = 80;
  else if (tempAvg < 32) tempScore = 100;
  else if (tempAvg < 38) tempScore = 70;
  else tempScore = 40;

  let flyHumidityScore;

  if (humidity < 30) flyHumidityScore = 30;
  else if (humidity < 60) flyHumidityScore = 100;
  else if (humidity < 80) flyHumidityScore = 70;
  else flyHumidityScore = 50;

  let rainPenalty = precipitation > 4 ? -25 : 0;

  windPenalty = 0;
  if (wind > 30) windPenalty = -30;
  else if (wind > 18) windPenalty = -10;

  const flyScore = clamp(
    0.55 * tempScore +
    0.35 * flyHumidityScore +
    rainPenalty +
    windPenalty
  );

  /* ---------------- MIGRAINE RISK ---------------- */

  let pressureScore;

  if (pressureChange < 2) pressureScore = 10;
  else if (pressureChange < 4) pressureScore = 40;
  else if (pressureChange < 6) pressureScore = 75;
  else pressureScore = 100;

  const migraineHumidityScore = clamp((humidity - 50) * 1.5);

  let heatScore;

  if (tempMax < 20) heatScore = 20;
  else if (tempMax < 28) heatScore = 40;
  else if (tempMax < 34) heatScore = 70;
  else heatScore = 90;

  let windScore = wind > 35 ? 60 : 20;

  const migraineScore = clamp(
    0.45 * pressureScore +
    0.25 * migraineHumidityScore +
    0.2 * heatScore +
    0.1 * windScore
  );

  /* ---------------- FLU RISK ---------------- */

  let fluTempScore;

  if (tempMin < 0) fluTempScore = 50;
  else if (tempMin < 10) fluTempScore = 100;
  else if (tempMin < 15) fluTempScore = 80;
  else if (tempMin < 20) fluTempScore = 50;
  else if (tempMin < 25) fluTempScore = 20;
  else fluTempScore = 5;

  let fluHumidityScore;

  if (humidity < 30) fluHumidityScore = 100;
  else if (humidity < 40) fluHumidityScore = 80;
  else if (humidity < 60) fluHumidityScore = 50;
  else if (humidity < 80) fluHumidityScore = 25;
  else fluHumidityScore = 10;

  const fluScore = clamp(
    0.65 * fluTempScore +
    0.35 * fluHumidityScore
  );

  /* ---------------- INFECTION SPREAD ---------------- */

  let infectionTempScore;

  if (tempAvg < 5) infectionTempScore = 20;
  else if (tempAvg < 15) infectionTempScore = 70;
  else if (tempAvg < 25) infectionTempScore = 100;
  else if (tempAvg < 35) infectionTempScore = 60;
  else infectionTempScore = 30;

  let infectionHumidityScore;

  if (humidity < 30) infectionHumidityScore = 30;
  else if (humidity < 60) infectionHumidityScore = 70;
  else if (humidity < 80) infectionHumidityScore = 100;
  else infectionHumidityScore = 90;

  let uvPenalty = 0;
  if (uv > 9) uvPenalty = -40;
  else if (uv > 6) uvPenalty = -20;

  const infectionScore = clamp(
    0.5 * infectionHumidityScore +
    0.4 * infectionTempScore +
    uvPenalty
  );

  /* ---------------- HEAT ILLNESS ---------------- */

  const heatIndexScore = clamp(
    (tempMax * 2) +
    (humidity * 0.4)
  );

  /* ---------------- DEHYDRATION ---------------- */

  const dehydrationScore = clamp(
    (tempMax * 2.2) +
    (wind * 1.8) -
    (humidity * 0.25)
  );

  return {
    mosquito: riskLevel(mosquitoScore),
    houseflies: riskLevel(flyScore),
    migraine: riskLevel(migraineScore),
    flu: riskLevel(fluScore),
    infection: riskLevel(infectionScore),
    heatIllness: riskLevel(heatIndexScore),
    dehydration: riskLevel(dehydrationScore),

    scores: {
      mosquitoScore,
      flyScore,
      migraineScore,
      fluScore,
      infectionScore,
      heatIndexScore,
      dehydrationScore
    }
  };

};
