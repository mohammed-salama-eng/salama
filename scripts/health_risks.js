function clamp(v, min = 0, max = 100) {
  if (isNaN(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

function safe(v, fallback = 0) {
  return (v === undefined || v === null || isNaN(v)) ? fallback : v;
}

function riskLevel(score) {
  if (score < 35) return "low";
  if (score < 65) return "moderate";
  return "high";
}

module.exports = function calculateHealthRisks(weather) {
  const tempMax = safe(weather.temperature_2m_max);
  const tempMin = safe(weather.temperature_2m_min);
  const tempAvg = (tempMax + tempMin) / 2;
  const humidity = safe(weather.relative_humidity_2m_mean, 50);
  const wind = safe(weather.wind_speed_10m_max);
  const rain = safe(weather.precipitation_sum);
  const uv = safe(weather.uv_index_max);
  
  const pressureToday = safe(weather.pressure_msl_mean, 1010);
  const pressureYesterday = safe(weather.pressure_msl_mean_prev, pressureToday);
  const pressureChange = Math.abs(pressureToday - pressureYesterday);

  /* ---------------- MOSQUITO ACTIVITY ---------------- 
     Logic: Peak at 27°C, crashes > 35°C. High humidity essential.
  */
  let mTemp = tempAvg > 20 && tempAvg < 33 ? 100 : (tempAvg > 33 ? 40 : 20);
  let mHum = humidity > 60 ? 100 : (humidity > 40 ? 50 : 10);
  let mRain = rain > 0.5 ? 80 : 20; // Rain today predicts breeding in coming days
  const mosquitoScore = clamp((mTemp * 0.5) + (mHum * 0.3) + (mRain * 0.2) - (wind > 15 ? 20 : 0));

  /* ---------------- HOUSEFLY ACTIVITY ---------------- 
     Logic: Metabolism peaks at 33°C. High wind prevents landing.
  */
  let fTemp = tempAvg > 28 && tempAvg < 36 ? 100 : 50;
  let fWind = wind > 20 ? -30 : 0;
  const flyScore = clamp((fTemp * 0.7) + (humidity * 0.3) + fWind);

  /* ---------------- SCORPION & SNAKE ---------------- 
     Logic: Active on warm nights (TempMin > 22°C). 
     Rain "flushes" them out. Low wind preferred.
  */
  let sNightTemp = tempMin > 20 ? 80 : 30;
  let sRain = rain > 2 ? 100 : 20; // Rain is a huge displacement trigger
  let sWind = wind > 15 ? -20 : 0;
  const wildlifeScore = clamp((sNightTemp * 0.5) + (sRain * 0.4) + 10 + sWind);

  /* ---------------- MIGRAINE RISK ---------------- 
     Logic: Rapid pressure shifts + extreme heat dehydration.
  */
  let pScore = pressureChange > 4 ? 100 : (pressureChange > 2 ? 60 : 20);
  let heatTrigger = tempMax > 38 ? 40 : 0;
  const migraineScore = clamp((pScore * 0.7) + heatTrigger + (humidity < 25 ? 20 : 0));

  /* ---------------- FLU / RESPIRATORY ---------------- 
     Logic: Viruses thrive in DRY air (Low AH). Dust (Wind + Low Humidity).
  */
  let fHum = humidity < 30 ? 100 : (humidity < 50 ? 50 : 10);
  let fDust = (wind > 20 && humidity < 30) ? 30 : 0;
  const fluScore = clamp((fHum * 0.8) + fDust + (tempMin < 15 ? 20 : 0));

  /* ---------------- HEAT ILLNESS ---------------- 
     Logic: High Temp + High Humidity (Wet Bulb effect).
  */
  const heatIndexScore = clamp(((tempMax - 30) * 4) + (humidity * 0.5));

  /* ---------------- DEHYDRATION ---------------- 
     Logic: Aridity + Wind (evaporative cooling takes water from skin).
  */
  const dehydrationScore = clamp((tempMax * 1.5) + (wind * 0.5) - (humidity * 0.2));

  return {
    mosquito: riskLevel(mosquitoScore),
    houseflies: riskLevel(flyScore),
    wildlife: riskLevel(wildlifeScore), // Scorpions and Snakes
    migraine: riskLevel(migraineScore),
    flu: riskLevel(fluScore),
    heatIllness: riskLevel(heatIndexScore),
    dehydration: riskLevel(dehydrationScore),

    scores: {
      mosquitoScore: Math.round(mosquitoScore),
      flyScore: Math.round(flyScore),
      wildlifeScore: Math.round(wildlifeScore),
      migraineScore: Math.round(migraineScore),
      fluScore: Math.round(fluScore),
      heatIndexScore: Math.round(heatIndexScore),
      dehydrationScore: Math.round(dehydrationScore)
    }
  };
};
