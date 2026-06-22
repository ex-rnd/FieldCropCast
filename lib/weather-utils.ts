import type { DailyForecast, FarmState, Risks, Recommendation } from './types';

export function wmoIcon(code: number, isDay = true): string {
  const c = parseInt(String(code), 10);
  if (c === 0)               return isDay ? '☀️' : '🌙';
  if (c === 1)               return isDay ? '🌤' : '🌙';
  if (c === 2)               return isDay ? '⛅' : '☁️';
  if (c === 3)               return '☁️';
  if (c === 45 || c === 48)  return '🌫';
  if (c >= 51 && c <= 55)    return '🌦';
  if (c >= 56 && c <= 57)    return '🌨';
  if (c >= 61 && c <= 65)    return '🌧';
  if (c >= 66 && c <= 67)    return '🌨';
  if (c >= 71 && c <= 77)    return '❄️';
  if (c >= 80 && c <= 82)    return isDay ? '🌦' : '🌧';
  if (c === 85 || c === 86)  return '🌨';
  if (c === 95)              return '⛈';
  if (c === 96 || c === 99)  return '⛈';
  return isDay ? '🌤' : '🌙';
}

export function wmoText(code: number): string {
  const c = parseInt(String(code), 10);
  if (c === 0)  return 'Clear sky';
  if (c === 1)  return 'Mainly clear';
  if (c === 2)  return 'Partly cloudy';
  if (c === 3)  return 'Overcast';
  if (c === 45 || c === 48) return 'Foggy';
  if (c === 51) return 'Light drizzle';
  if (c === 53) return 'Moderate drizzle';
  if (c === 55) return 'Dense drizzle';
  if (c === 61) return 'Slight rain';
  if (c === 63) return 'Moderate rain';
  if (c === 65) return 'Heavy rain';
  if (c >= 71 && c <= 77) return 'Snow';
  if (c >= 80 && c <= 82) return 'Rain showers';
  if (c === 95) return 'Thunderstorm';
  if (c === 96 || c === 99) return 'Thunderstorm with hail';
  return 'Mixed conditions';
}

export function degreesToCardinal(deg: number | null | undefined): string {
  if (deg == null) return '';
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  return dirs[Math.round(deg / 45) % 8];
}

export function isDaytime(daily: DailyForecast[]): boolean {
  if (!daily?.length) return true;
  const today = daily[0];
  if (!today.sunrise || !today.sunset) return true;
  const now = new Date();
  return now >= new Date(today.sunrise) && now <= new Date(today.sunset);
}

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function dayName(dateStr: string): string {
  return DAY_NAMES[new Date(dateStr + 'T12:00:00').getDay()];
}

export function localHour(isoStr: string): string {
  return new Date(isoStr).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true });
}

export function fmtTemp(c: number | null | undefined, units: 'metric' | 'imperial'): string {
  if (c == null) return '—';
  return units === 'imperial' ? Math.round(c * 9 / 5 + 32) + '°F' : Math.round(c) + '°C';
}

export function fmtWind(kph: number | null | undefined, units: 'metric' | 'imperial'): string {
  if (kph == null) return '—';
  return units === 'imperial' ? Math.round(kph * 0.621) + ' mph' : Math.round(kph) + ' km/h';
}

export function fmtPrecip(mm: number | null | undefined, units: 'metric' | 'imperial'): string {
  if (mm == null) return '—';
  return units === 'imperial' ? (mm * 0.0394).toFixed(2) + '"' : mm + ' mm';
}

const CROP_THRESHOLDS: Record<string, { heatC: number; frostC: number; windHigh: number; windCrit: number; rainHighMm: number; rainCritMm: number }> = {
  tea:       { heatC: 30, frostC: 5, windHigh: 30, windCrit: 55, rainHighMm: 15, rainCritMm: 30 },
  coffee:    { heatC: 32, frostC: 4, windHigh: 25, windCrit: 50, rainHighMm: 20, rainCritMm: 40 },
  maize:     { heatC: 35, frostC: 2, windHigh: 35, windCrit: 60, rainHighMm: 25, rainCritMm: 50 },
  wheat:     { heatC: 30, frostC: 2, windHigh: 30, windCrit: 55, rainHighMm: 20, rainCritMm: 35 },
  rice:      { heatC: 40, frostC: 8, windHigh: 30, windCrit: 50, rainHighMm: 30, rainCritMm: 60 },
  beans:     { heatC: 32, frostC: 3, windHigh: 25, windCrit: 45, rainHighMm: 20, rainCritMm: 35 },
  tomatoes:  { heatC: 32, frostC: 5, windHigh: 25, windCrit: 45, rainHighMm: 15, rainCritMm: 25 },
  potatoes:  { heatC: 28, frostC: 2, windHigh: 30, windCrit: 55, rainHighMm: 20, rainCritMm: 35 },
  sugarcane: { heatC: 38, frostC: 5, windHigh: 40, windCrit: 65, rainHighMm: 30, rainCritMm: 55 },
  flowers:   { heatC: 28, frostC: 4, windHigh: 20, windCrit: 40, rainHighMm: 10, rainCritMm: 20 },
  general:   { heatC: 35, frostC: 3, windHigh: 35, windCrit: 60, rainHighMm: 20, rainCritMm: 40 },
};

function riskLabel(score: number): 'low' | 'moderate' | 'high' | 'critical' {
  if (score >= 85) return 'critical';
  if (score >= 55) return 'high';
  if (score >= 25) return 'moderate';
  return 'low';
}

export function riskBarColor(level: string): string {
  return ({ low: '#4ade80', moderate: '#fbbf24', high: '#f97316', critical: '#ef4444' } as any)[level] || '#4ade80';
}

export function computeRisks(daily: DailyForecast[], crop: string, units: 'metric' | 'imperial'): Risks {
  const thr = CROP_THRESHOLDS[crop] || CROP_THRESHOLDS.general;

  const maxPrecip  = Math.max(...daily.map(d => d.precipitation_sum || 0));
  const maxPrecipP = Math.max(...daily.map(d => d.precipitation_probability || 0));
  let rainScore = 0;
  if (maxPrecip >= thr.rainCritMm)       rainScore = 90 + Math.min(10, maxPrecip - thr.rainCritMm);
  else if (maxPrecip >= thr.rainHighMm)  rainScore = 55 + 35 * (maxPrecip - thr.rainHighMm) / (thr.rainCritMm - thr.rainHighMm);
  else rainScore = maxPrecipP * 0.3;

  const maxWind = Math.max(...daily.map(d => d.wind_max || 0));
  let windScore = 0;
  if (maxWind >= thr.windCrit)      windScore = 90 + Math.min(10, maxWind - thr.windCrit);
  else if (maxWind >= thr.windHigh) windScore = 55 + 35 * (maxWind - thr.windHigh) / (thr.windCrit - thr.windHigh);
  else windScore = (maxWind / thr.windHigh) * 24;

  const maxTemp = Math.max(...daily.map(d => d.temp_max || 0));
  const minTemp = Math.min(...daily.map(d => d.temp_min != null ? d.temp_min : 99));
  let tempScore = 0;
  if (maxTemp >= thr.heatC + 6)       tempScore = 92;
  else if (maxTemp >= thr.heatC)      tempScore = 60 + 30 * (maxTemp - thr.heatC) / 6;
  if (minTemp <= thr.frostC - 3)      tempScore = Math.max(tempScore, 92);
  else if (minTemp <= thr.frostC)     tempScore = Math.max(tempScore, 60 + 30 * (thr.frostC - minTemp) / 3);

  return {
    rain: { score: rainScore, level: riskLabel(rainScore), detail: 'Peak: ' + fmtPrecip(maxPrecip, units) + ' · ' + maxPrecipP + '% chance' },
    wind: { score: windScore, level: riskLabel(windScore), detail: 'Max: ' + fmtWind(maxWind, units) },
    temp: { score: tempScore, level: riskLabel(tempScore), detail: 'High ' + fmtTemp(maxTemp, units) + ' · Low ' + fmtTemp(minTemp, units) },
  };
}

export function buildRecommendations(risks: Risks, daily: DailyForecast[], crop: string): Recommendation[] {
  const cropLabel = crop.charAt(0).toUpperCase() + crop.slice(1);
  const thr = CROP_THRESHOLDS[crop] || CROP_THRESHOLDS.general;
  const recs: Recommendation[] = [];

  if (risks.rain.level === 'critical') {
    recs.push({ cls: 'urgent', icon: '🚨', text: `Heavy rain forecast. Postpone all ground operations for ${cropLabel}. Inspect drainage channels and cover exposed seedbeds.` });
  } else if (risks.rain.level === 'high') {
    recs.push({ cls: 'warning', icon: '⚠️', text: 'Significant rainfall expected. Delay fertiliser and pesticide application. Reinforce furrow drainage.' });
  } else if (risks.rain.level === 'moderate') {
    recs.push({ cls: 'caution', icon: '🌧', text: 'Moderate rain possible. Complete open-field tasks before the rain window.' });
  } else {
    recs.push({ cls: 'good', icon: '✅', text: 'Rainfall risk is low — good conditions for irrigation scheduling and field operations.' });
  }

  if (risks.wind.level === 'critical') {
    recs.push({ cls: 'urgent', icon: '💨', text: `Dangerous wind speeds expected. Stake tall ${cropLabel} plants. Suspend all spray operations.` });
  } else if (risks.wind.level === 'high') {
    recs.push({ cls: 'warning', icon: '🌬', text: 'High winds forecast. Postpone aerial or spray work. Check trellising and shade nets.' });
  } else if (risks.wind.level === 'moderate') {
    recs.push({ cls: 'caution', icon: '🍃', text: 'Moderate wind expected. Schedule spraying for early morning when air is calm.' });
  }

  if (risks.temp.level === 'critical' || risks.temp.level === 'high') {
    const minT = daily.length ? Math.min(...daily.map(d => d.temp_min != null ? d.temp_min : 99)) : 99;
    if (minT <= thr.frostC) {
      recs.push({ cls: risks.temp.level === 'critical' ? 'urgent' : 'warning', icon: '❄️', text: `Frost risk for ${cropLabel}! Cover young plants overnight. Light irrigation before sunset raises soil temperature.` });
    } else {
      recs.push({ cls: risks.temp.level === 'critical' ? 'urgent' : 'warning', icon: '🔥', text: `Elevated heat forecast. Increase irrigation frequency. Consider shade netting for ${cropLabel}.` });
    }
  } else if (risks.temp.level === 'moderate') {
    recs.push({ cls: 'caution', icon: '☀️', text: 'Warm conditions — monitor soil moisture closely and water in the early morning.' });
  }

  if (risks.rain.level === 'low' && risks.wind.level === 'low' && risks.temp.level === 'low') {
    recs.push({ cls: 'good', icon: '🌟', text: 'Excellent conditions across the board — ideal window for planting, transplanting, or top-dressing.' });
  }
  return recs;
}

export function generateSummary(data: any, farmState: FarmState): string {
  const cur   = data.current  || {};
  const daily = data.daily    || [];
  const crop  = (farmState.crop || 'general').toLowerCase();
  const name  = farmState.name || 'Your farm';
  if (!daily.length) return '';

  const today   = daily[0] || {};
  const tempMax = today.temp_max  != null ? Math.round(today.temp_max)  : '—';
  const tempMin = today.temp_min  != null ? Math.round(today.temp_min)  : '—';
  const curTemp = cur.temperature != null ? Math.round(cur.temperature) : tempMax;
  const condText = wmoText(cur.condition_code || today.condition_code || 0);

  const rainyDays = daily.filter((d: any) => d.precipitation_sum > 1 || d.precipitation_probability > 50).length;
  const peakRain  = daily.reduce((a: any, b: any) => (b.precipitation_sum || 0) > (a.precipitation_sum || 0) ? b : a, daily[0]);
  const windyDay  = daily.reduce((a: any, b: any) => (b.wind_max || 0) > (a.wind_max || 0) ? b : a, daily[0]);

  const outlook = rainyDays === 0
    ? 'The next 7 days look predominantly dry with minimal rainfall expected.'
    : rainyDays <= 2
    ? `Mostly dry conditions ahead with ${rainyDays} day(s) of light rain in the forecast.`
    : rainyDays <= 4
    ? `${rainyDays} out of 7 days show rain activity — a mixed week ahead.`
    : `A predominantly wet week is expected with rain on ${rainyDays} of the next 7 days.`;

  let rainNote = '';
  if (peakRain.precipitation_sum > 5) {
    const peakDate = new Date(peakRain.date).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
    rainNote = ` The heaviest rainfall (${peakRain.precipitation_sum.toFixed(1)} mm) is expected on ${peakDate}.`;
  }

  let windNote = '';
  if (windyDay.wind_max > 30)       windNote = ` Strong winds peaking at ${windyDay.wind_max} km/h are expected — secure any structures or shade nets.`;
  else if (windyDay.wind_max > 20)  windNote = ` Moderate wind gusts up to ${windyDay.wind_max} km/h are forecast.`;

  let cropNote = '';
  if (crop === 'tea' || crop === 'coffee') {
    cropNote = ` Cooler nights (low ${tempMin}°C) are favorable for ${crop} quality.`;
  } else if (crop === 'maize' || crop === 'wheat' || crop === 'rice') {
    cropNote = rainyDays >= 3 ? ` Adequate moisture should support ${crop} development this week.` : ` Monitor soil moisture closely — irrigation may be needed for ${crop}.`;
  } else if (crop === 'tomatoes' || crop === 'potatoes') {
    cropNote = today.temp_max > 32 ? ` High temperatures may stress ${crop} — consider afternoon shading.` : ` Temperatures look manageable for ${crop} growth this week.`;
  } else {
    cropNote = ` Overall conditions are ${rainyDays <= 2 ? 'favorable' : 'mixed'} for field operations.`;
  }

  return `${name} is currently experiencing ${condText.toLowerCase()} at ${curTemp}°C (high ${tempMax}°C, low ${tempMin}°C). ${outlook}${rainNote}${windNote}${cropNote}`;
}
