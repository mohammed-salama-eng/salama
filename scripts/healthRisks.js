function clamp(v, min = 0, max = 100) {
  return Math.max(min, Math.min(max, v));
}

function riskLevel(score) {
  if (score < 20) return "very_low";
  if (score < 40) return "low";
  if (score < 60) return "moderate";
  if (score < 80) return "high";
  return "very_high";
}

module.exports = function calculateHealthRisks(weather) {

  const {
    temperature,
    humidity,
    wind,
    precipitation,
    uv,
    pressureToday,
    pressureYesterday
  } = weather;

  /* ---------------- MOSQUITO ACTIVITY ---------------- */

  let tempScore;

  if (temperature < 10) tempScore = 0;
  else if (temperature < 18) tempScore = 20;
  else if (temperature < 24) tempScore = 50;
  else if (temperature < 32) tempScore = 100;
  else if (temperature < 38) tempScore = 70;
  else tempScore = 20;

  const humidityScore = clamp((humidity - 40) * 2);

  let rainScore = 10;
  if (precipitation > 5) rainScore = 80;
  else if (precipitation > 1) rainScore = 40;

  let windPenalty = 0;
  if (wind > 20) windPenalty = -40;
  else if (wind > 12) windPenalty = -20;

  const mosquitoScore = clamp(
    0.45 * tempScore +
    0.35 * humidityScore +
    0.15 * rainScore +
    windPenalty
  );

  /* ---------------- HOUSEFLY ACTIVITY ---------------- */

  if (temperature < 10) tempScore = 0;
  else if (temperature < 18) tempScore = 30;
  else if (temperature < 24) tempScore = 70;
  else if (temperature < 30) tempScore = 100;
  else if (temperature < 36) tempScore = 80;
  else tempScore = 40;

  let flyHumidityScore;

  if (humidity < 30) flyHumidityScore = 20;
  else if (humidity < 60) flyHumidityScore = 100;
  else if (humidity < 80) flyHumidityScore = 70;
  else flyHumidityScore = 40;

  let rainPenalty = precipitation > 3 ? -30 : 0;

  windPenalty = 0;
  if (wind > 20) windPenalty = -30;
  else if (wind > 12) windPenalty = -10;

  const flyScore = clamp(
    0.55 * tempScore +
    0.35 * flyHumidityScore +
    rainPenalty +
    windPenalty
  );

  /* ---------------- MIGRAINE RISK ---------------- */

  const pressureChange = Math.abs(pressureToday - pressureYesterday);

  let pressureScore;

  if (pressureChange < 2) pressureScore = 10;
  else if (pressureChange < 4) pressureScore = 40;
  else if (pressureChange < 6) pressureScore = 70;
  else pressureScore = 100;

  const migraineHumidityScore = clamp((humidity - 50) * 2);

  let heatScore;

  if (temperature < 20) heatScore = 20;
  else if (temperature < 28) heatScore = 40;
  else if (temperature < 34) heatScore = 70;
  else heatScore = 90;

  let windScore = wind > 25 ? 60 : 20;

  const migraineScore = clamp(
    0.45 * pressureScore +
    0.25 * migraineHumidityScore +
    0.2 * heatScore +
    0.1 * windScore
  );

  /* ---------------- FLU RISK ---------------- */

  let fluTempScore;

  if (temperature < 0) fluTempScore = 40;
  else if (temperature < 10) fluTempScore = 100;
  else if (temperature < 15) fluTempScore = 80;
  else if (temperature < 20) fluTempScore = 50;
  else if (temperature < 25) fluTempScore = 20;
  else fluTempScore = 5;

  let fluHumidityScore;

  if (humidity < 30) fluHumidityScore = 100;
  else if (humidity < 40) fluHumidityScore = 80;
  else if (humidity < 60) fluHumidityScore = 50;
  else if (humidity < 80) fluHumidityScore = 20;
  else fluHumidityScore = 10;

  const fluScore = clamp(
    0.65 * fluTempScore +
    0.35 * fluHumidityScore
  );

  /* ---------------- INFECTION SPREAD ---------------- */

  let infectionTempScore;

  if (temperature < 5) infectionTempScore = 20;
  else if (temperature < 15) infectionTempScore = 70;
  else if (temperature < 25) infectionTempScore = 100;
  else if (temperature < 35) infectionTempScore = 60;
  else infectionTempScore = 30;

  let infectionHumidityScore;

  if (humidity < 30) infectionHumidityScore = 30;
  else if (humidity < 60) infectionHumidityScore = 70;
  else if (humidity < 80) infectionHumidityScore = 100;
  else infectionHumidityScore = 90;

  let uvPenalty = 0;

  if (uv > 8) uvPenalty = -40;
  else if (uv > 5) uvPenalty = -20;

  const infectionScore = clamp(
    0.5 * infectionHumidityScore +
    0.4 * infectionTempScore +
    uvPenalty
  );

  /* ---------------- HEAT ILLNESS RISK ---------------- */

  const heatIndexScore = clamp(
    (temperature * 2) +
    (humidity * 0.5)
  );

  /* ---------------- DEHYDRATION RISK ---------------- */

  const dehydrationScore = clamp(
    (temperature * 2) +
    (wind * 2) -
    (humidity * 0.5)
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
