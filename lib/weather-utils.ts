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
  if (c === 0)               return 'Anga wazi';
  if (c === 1)               return 'Anga wazi zaidi';
  if (c === 2)               return 'Mawingu kidogo';
  if (c === 3)               return 'Mawingu mengi';
  if (c === 45 || c === 48)  return 'Ukungu';
  if (c === 51)              return 'Mvua nyepesi sana';
  if (c === 53)              return 'Mvua nyepesi';
  if (c === 55)              return 'Mvua nyepesi nzito';
  if (c === 61)              return 'Mvua kidogo';
  if (c === 63)              return 'Mvua wastani';
  if (c === 65)              return 'Mvua kubwa';
  if (c >= 71 && c <= 77)    return 'Theluji';
  if (c >= 80 && c <= 82)    return 'Manyunyu ya mvua';
  if (c === 95)              return 'Dhoruba ya radi';
  if (c === 96 || c === 99)  return 'Dhoruba na mvua ya mawe';
  return 'Hali mchanganyiko';
}

export function degreesToCardinal(deg: number | null | undefined): string {
  if (deg == null) return '';
  const dirs = ['K', 'KS', 'S', 'KS', 'J', 'MJ', 'M', 'KM'];
  return dirs[Math.round(deg / 45) % 8];
}

export function isDaytime(daily: DailyForecast[]): boolean {
  if (!daily?.length) return true;
  const today = daily[0];
  if (!today.sunrise || !today.sunset) return true;
  const now = new Date();
  return now >= new Date(today.sunrise) && now <= new Date(today.sunset);
}

const DAY_NAMES = ['Jumapili', 'Jumatatu', 'Jumanne', 'Jumatano', 'Alhamisi', 'Ijumaa', 'Jumamosi'];
const DAY_SHORT = ['Jpi', 'Jtt', 'Jwn', 'Jto', 'Alh', 'Iju', 'Jms'];

export function dayName(dateStr: string, short = true): string {
  const idx = new Date(dateStr + 'T12:00:00').getDay();
  return short ? DAY_SHORT[idx] : DAY_NAMES[idx];
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

// Swahili crop names
const CROP_SW: Record<string, string> = {
  general:   'mazao',
  maize:     'mahindi',
  tea:       'chai',
  coffee:    'kahawa',
  wheat:     'ngano',
  rice:      'mchele',
  beans:     'maharagwe',
  tomatoes:  'nyanya',
  potatoes:  'viazi',
  sugarcane: 'miwa',
  flowers:   'maua',
};

function cropSw(crop: string): string {
  return CROP_SW[crop] || crop;
}

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
    rain: { score: rainScore, level: riskLabel(rainScore), detail: 'Kilele: ' + fmtPrecip(maxPrecip, units) + ' · uwezekano ' + maxPrecipP + '%' },
    wind: { score: windScore, level: riskLabel(windScore), detail: 'Kasi kubwa: ' + fmtWind(maxWind, units) },
    temp: { score: tempScore, level: riskLabel(tempScore), detail: 'Juu ' + fmtTemp(maxTemp, units) + ' · Chini ' + fmtTemp(minTemp, units) },
  };
}

export function buildRecommendations(risks: Risks, daily: DailyForecast[], crop: string): Recommendation[] {
  const sw  = cropSw(crop);
  const thr = CROP_THRESHOLDS[crop] || CROP_THRESHOLDS.general;
  const recs: Recommendation[] = [];

  // ── Mvua (Rain) ────────────────────────────────────────────────────
  if (risks.rain.level === 'critical') {
    recs.push({ cls: 'urgent', icon: '🚨', text: `Mvua kubwa inatarajiwa. Simamisha kazi zote za shambani kwa ${sw}. Angalia mifereji ya maji na funika vitalu vilivyo wazi.` });
  } else if (risks.rain.level === 'high') {
    recs.push({ cls: 'warning', icon: '⚠️', text: 'Mvua kubwa inatarajiwa. Acha kunyunyizia mbolea na dawa. Imarisha mifereji ya mashamba.' });
  } else if (risks.rain.level === 'moderate') {
    recs.push({ cls: 'caution', icon: '🌧', text: 'Mvua wastani inawezekana. Kamilisha kazi za shambani kabla mvua haijanyesha.' });
  } else {
    recs.push({ cls: 'good', icon: '✅', text: 'Hatari ya mvua ni ndogo — hali nzuri kwa kupanga umwagiliaji na kazi za shambani.' });
  }

  // ── Upepo (Wind) ───────────────────────────────────────────────────
  if (risks.wind.level === 'critical') {
    recs.push({ cls: 'urgent', icon: '💨', text: `Kasi ya upepo hatari inatarajiwa. Weka nguzo mimea mirefu ya ${sw}. Simamisha kazi zote za kunyunyizia.` });
  } else if (risks.wind.level === 'high') {
    recs.push({ cls: 'warning', icon: '🌬', text: 'Upepo mkali unatarajiwa. Ahirisha kazi za kunyunyizia angani. Angalia matrelisi na nyavu za kivuli.' });
  } else if (risks.wind.level === 'moderate') {
    recs.push({ cls: 'caution', icon: '🍃', text: 'Upepo wastani unatarajiwa. Panga kunyunyizia asubuhi mapema wakati hewa iko tulivu.' });
  }

  // ── Joto / Baridi (Temperature) ────────────────────────────────────
  if (risks.temp.level === 'critical' || risks.temp.level === 'high') {
    const minT = daily.length ? Math.min(...daily.map(d => d.temp_min != null ? d.temp_min : 99)) : 99;
    if (minT <= thr.frostC) {
      recs.push({ cls: risks.temp.level === 'critical' ? 'urgent' : 'warning', icon: '❄️', text: `Hatari ya baridi kali kwa ${sw}! Funika mimea michanga usiku. Umwagilia kidogo kabla ya jua kuchwa ili kuinua joto la udongo.` });
    } else {
      recs.push({ cls: risks.temp.level === 'critical' ? 'urgent' : 'warning', icon: '🔥', text: `Joto kali linatarajiwa. Ongeza mara za kumwagilia. Fikiria kutumia nyavu za kivuli kwa ${sw}.` });
    }
  } else if (risks.temp.level === 'moderate') {
    recs.push({ cls: 'caution', icon: '☀️', text: 'Hali ya joto — angalia unyevu wa udongo kwa makini na mwagilia asubuhi mapema.' });
  }

  // ── Hali nzuri ─────────────────────────────────────────────────────
  if (risks.rain.level === 'low' && risks.wind.level === 'low' && risks.temp.level === 'low') {
    recs.push({ cls: 'good', icon: '🌟', text: 'Hali nzuri kabisa — wakati mzuri wa kupanda, kupandikiza, au kutia mbolea ya juu.' });
  }

  return recs;
}

export function generateSummary(data: any, farmState: FarmState): string {
  const cur   = data.current  || {};
  const daily = data.daily    || [];
  const crop  = (farmState.crop || 'general').toLowerCase();
  const name  = farmState.name || 'Shamba lako';
  if (!daily.length) return '';

  const today   = daily[0] || {};
  const tempMax = today.temp_max  != null ? Math.round(today.temp_max)  : '—';
  const tempMin = today.temp_min  != null ? Math.round(today.temp_min)  : '—';
  const curTemp = cur.temperature != null ? Math.round(cur.temperature) : tempMax;
  const condText = wmoText(cur.condition_code || today.condition_code || 0);
  const sw       = cropSw(crop);

  const rainyDays = daily.filter((d: any) => d.precipitation_sum > 1 || d.precipitation_probability > 50).length;
  const peakRain  = daily.reduce((a: any, b: any) => (b.precipitation_sum || 0) > (a.precipitation_sum || 0) ? b : a, daily[0]);
  const windyDay  = daily.reduce((a: any, b: any) => (b.wind_max || 0) > (a.wind_max || 0) ? b : a, daily[0]);

  const outlook = rainyDays === 0
    ? 'Siku 7 zijazo zinaonekana kuwa kavu bila mvua inayotarajiwa.'
    : rainyDays <= 2
    ? `Hali kavu zaidi inatarajiwa na siku ${rainyDays} za mvua ndogo katika utabiri.`
    : rainyDays <= 4
    ? `Siku ${rainyDays} kati ya 7 zinaonyesha shughuli za mvua — wiki yenye hali mchanganyiko.`
    : `Wiki yenye mvua nyingi inatarajiwa na mvua siku ${rainyDays} kati ya 7 zijazo.`;

  let rainNote = '';
  if (peakRain.precipitation_sum > 5) {
    const peakDate = new Date(peakRain.date + 'T12:00:00').toLocaleDateString('sw-KE', { weekday: 'long', day: 'numeric', month: 'short' });
    rainNote = ` Mvua kubwa zaidi (mm ${peakRain.precipitation_sum.toFixed(1)}) inatarajiwa ${peakDate}.`;
  }

  let windNote = '';
  if (windyDay.wind_max > 30)      windNote = ` Upepo mkali unaofika ${windyDay.wind_max} km/h unatarajiwa — hakikisha miundo na nyavu za kivuli.`;
  else if (windyDay.wind_max > 20) windNote = ` Upepo wa wastani hadi ${windyDay.wind_max} km/h umetabiriwa.`;

  let cropNote = '';
  if (crop === 'tea' || crop === 'coffee') {
    cropNote = ` Usiku wa baridi (chini ${tempMin}°C) ni mzuri kwa ubora wa ${sw}.`;
  } else if (crop === 'maize' || crop === 'wheat' || crop === 'rice') {
    cropNote = rainyDays >= 3
      ? ` Unyevu wa kutosha unatarajiwa kusaidia ukuaji wa ${sw} wiki hii.`
      : ` Angalia unyevu wa udongo — umwagiliaji unaweza kuhitajika kwa ${sw}.`;
  } else if (crop === 'tomatoes' || crop === 'potatoes') {
    cropNote = today.temp_max > 32
      ? ` Joto kali linaweza kudhuru ${sw} — fikiria kivuli cha mchana.`
      : ` Joto linaonekana kuwa sawa kwa ukuaji wa ${sw} wiki hii.`;
  } else {
    cropNote = ` Hali kwa ujumla ni ${rainyDays <= 2 ? 'nzuri' : 'yenye msongo'} kwa shughuli za shambani.`;
  }

  return `${name} kwa sasa ina ${condText.toLowerCase()} kwa joto la ${curTemp}°C (juu ${tempMax}°C, chini ${tempMin}°C). ${outlook}${rainNote}${windNote}${cropNote}`;
}

// Re-export for backwards compatibility
export { CROP_THRESHOLDS };
