function clamp(v, min = 0, max = 100) {
  if (isNaN(v)) return 0;
  return Math.max(min, Math.min(max, v));
}

function safe(v, fallback = 0) {
  return (v === undefined || v === null || isNaN(v)) ? fallback : v;
}

// Higher resolution risk levels
function riskLevel(score) {
  if (score < 30) return "low";
  if (score < 60) return "moderate";
  if (score < 85) return "high";
  return "extreme";
}

module.exports = function calculateEnhancedHealthRisks(weather) {
  // --- Input Data Extraction ---
  const tMax = safe(weather.daily.temperature_2m_max?.[0]);
  const tMin = safe(weather.daily.temperature_2m_min?.[0]);
  const tAvg = safe(weather.daily.temperature_2m_mean?.[0], (tMax + tMin) / 2);
  const rh = safe(weather.daily.relative_humidity_2m_mean?.[0], 50);
  const rain = safe(weather.daily.precipitation_sum?.[0]);
  const wind = safe(weather.daily.wind_speed_10m_max?.[0]);
  const uv = safe(weather.daily.uv_index_max?.[0]);
  const solar = safe(weather.daily.shortwave_radiation_sum?.[0]); // MJ/m²

  const pToday = safe(weather.daily.pressure_msl_mean?.[0], 1010);
  const pPrev = safe(weather.daily.pressure_msl_mean_prev?.[1], pToday);
  const pDelta = Math.abs(pToday - pPrev);

  // --- 1. MOSQUITO ACTIVITY (Biological Curve) ---
  // Peak activity is at 27°C. Activity drops off sharply above 38°C (desiccation risk).
  const mTempFactor = Math.exp(-Math.pow(tAvg - 27, 2) / 50); 
  const mHumFactor = rh / 100;
  const mRainFactor = rain > 0.2 ? 0.3 : 0; // Standing water potential
  const mosquitoScore = clamp(((mTempFactor * 0.6) + (mHumFactor * 0.3) + mRainFactor) * 100 - (wind > 15 ? 20 : 0));

  // --- 2. HOUSEFLY ACTIVITY ---
  // Flies are most active in high heat (33°C) but hate high winds.
  const fTempFactor = Math.exp(-Math.pow(tAvg - 33, 2) / 60);
  const flyScore = clamp(((fTempFactor * 0.7) + (rh > 40 ? 0.2 : 0.1)) * 100 - (wind > 20 ? 30 : 0));

  // --- 3. SCORPION ACTIVITY (Night-time Floor) ---
  // Scorpions in Sudan are nocturnal. They emerge when tMin is high and ground is dry.
  let scorpionScore = 0;
  if (tMin > 22) scorpionScore += 50;
  if (tMin > 28) scorpionScore += 30; // Very high nocturnal activity
  if (rh < 30) scorpionScore += 20; // Scorpions prefer dry conditions for hunting
  if (rain > 5) scorpionScore -= 40; // Heavy rain keeps them in burrows (unlike snakes)
  scorpionScore = clamp(scorpionScore - (wind > 20 ? 15 : 0));

  // --- 4. SNAKE ACTIVITY (Displacement Risk) ---
  // Snakes are highly active post-rain (flushing) and in moderate "Goldilocks" temps.
  let snakeScore = 0;
  const sTempFactor = Math.exp(-Math.pow(tAvg - 30, 2) / 80);
  snakeScore += sTempFactor * 60;
  if (rain > 2) snakeScore += 40; // Flood/Rain displacement is the #1 risk for stings
  if (tMin > 24) snakeScore += 10;
  snakeScore = clamp(snakeScore - (wind > 25 ? 20 : 0));

  // --- 5. MIGRAINE RISK (Atmospheric Stress) ---
  // Driven by Barometric shifts and Dehydration/Heat triggers.
  const pScore = pDelta > 4 ? 70 : (pDelta * 15);
  const mHeatScore = tMax > 39 ? 30 : 0;
  const migraineScore = clamp(pScore + mHeatScore + (rh < 25 ? 20 : 0));

  // --- 6. FLU & RESPIRATORY (The Aridity/Dust Factor) ---
  // In Sudan, "Flu" season is often "Dust" season. Low RH cracks membranes.
  const aridityFactor = clamp((100 - rh) * 0.7);
  const dustFactor = (wind > 25 && rh < 30) ? 30 : 0; // Haboob signature
  const fluScore = clamp(aridityFactor + dustFactor + (tMin < 16 ? 20 : 0));

  // --- 7. HEAT ILLNESS (Wet Bulb Proxy) ---
  const heatIndex = (tMax * 0.8) + (rh * 0.2); // Simplified Heat Index proxy
  const heatScore = clamp((heatIndex - 25) * 4);

  // --- 8. DEHYDRATION (Evaporative Loss) ---
  // High temp + High wind + Low RH = Rapid water loss.
  const dehydrationScore = clamp((tMax * 1.2) + (wind * 0.4) - (rh * 0.2) + (solar / 2 || 0));

  return {
    mosquito: riskLevel(mosquitoScore),
    houseflies: riskLevel(flyScore),
    scorpion: riskLevel(scorpionScore),
    snake: riskLevel(snakeScore),
    migraine: riskLevel(migraineScore),
    flu: riskLevel(fluScore),
    heatIllness: riskLevel(heatScore),
    dehydration: riskLevel(dehydrationScore),

    scores: {
      mosquito: Math.round(mosquitoScore),
      houseflies: Math.round(flyScore),
      scorpion: Math.round(scorpionScore),
      snake: Math.round(snakeScore),
      migraine: Math.round(migraineScore),
      flu: Math.round(fluScore),
      heatIllness: Math.round(heatScore),
      dehydration: Math.round(dehydrationScore)
    }
  };
};
