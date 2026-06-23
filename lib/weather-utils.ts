import type { DailyForecast, FarmState, Risks, Recommendation, CropStageResult } from './types';

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
  sugarcane:  { heatC: 38, frostC: 5,  windHigh: 40, windCrit: 65, rainHighMm: 30, rainCritMm: 55 },
  flowers:    { heatC: 28, frostC: 4,  windHigh: 20, windCrit: 40, rainHighMm: 10, rainCritMm: 20 },
  bananas:    { heatC: 38, frostC: 10, windHigh: 30, windCrit: 50, rainHighMm: 25, rainCritMm: 45 },
  greengrams: { heatC: 35, frostC: 5,  windHigh: 25, windCrit: 45, rainHighMm: 15, rainCritMm: 30 },
  cowpeas:    { heatC: 38, frostC: 5,  windHigh: 25, windCrit: 45, rainHighMm: 15, rainCritMm: 30 },
  sorghum:    { heatC: 40, frostC: 2,  windHigh: 35, windCrit: 60, rainHighMm: 15, rainCritMm: 30 },
  cassava:    { heatC: 40, frostC: 5,  windHigh: 35, windCrit: 60, rainHighMm: 20, rainCritMm: 45 },
  mangoes:    { heatC: 40, frostC: 8,  windHigh: 30, windCrit: 55, rainHighMm: 20, rainCritMm: 40 },
  general:    { heatC: 35, frostC: 3,  windHigh: 35, windCrit: 60, rainHighMm: 20, rainCritMm: 40 },
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
  sugarcane:  'miwa',
  flowers:    'maua',
  bananas:    'ndizi',
  greengrams: 'ndengu',
  cowpeas:    'kunde',
  sorghum:    'mtama',
  cassava:    'muhogo',
  mangoes:    'maembe',
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
  const name  = farmState.name;
  if (!daily.length) return '';

  const today   = daily[0] || {};
  const tempMax = today.temp_max  != null ? Math.round(today.temp_max)  : null;
  const tempMin = today.temp_min  != null ? Math.round(today.temp_min)  : null;
  const curTemp = cur.temperature != null ? Math.round(cur.temperature) : tempMax;
  const condCode = cur.condition_code || today.condition_code || 0;
  const sw = cropSw(crop);

  const rainyDays = daily.filter((d: any) => d.precipitation_sum > 1 || d.precipitation_probability > 50).length;
  const peakRain  = daily.reduce((a: any, b: any) => (b.precipitation_sum || 0) > (a.precipitation_sum || 0) ? b : a, daily[0]);
  const windyDay  = daily.reduce((a: any, b: any) => (b.wind_max || 0) > (a.wind_max || 0) ? b : a, daily[0]);

  // ── Time-aware greeting ────────────────────────────────────────────
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Habari za asubuhi' : hour < 17 ? 'Habari za mchana' : 'Habari za jioni';
  const addressee = name ? `, ${name}` : '';

  // ── Current conditions — conversational ───────────────────────────
  const isHot  = curTemp != null && curTemp >= 28;
  const isCool = curTemp != null && curTemp <= 14;
  const condFeel = isHot ? 'iko joto kidogo' : isCool ? 'ipo baridi' : 'iko sawa';

  let currentDesc = '';
  if (curTemp != null && tempMax != null && tempMin != null) {
    currentDesc = `Leo hali ya hewa ${condFeel} — sasa hivi ${curTemp}°C, na leo joto litafika ${tempMax}°C mchana na kushuka hadi ${tempMin}°C usiku.`;
  } else if (curTemp != null) {
    currentDesc = `Sasa hivi joto ni ${curTemp}°C na anga ${wmoText(condCode).toLowerCase()}.`;
  }

  // ── Week outlook — natural phrasing ───────────────────────────────
  let weekOutlook = '';
  if (rainyDays === 0) {
    weekOutlook = 'Wiki hii nzima itakuwa kavu — fursa nzuri ya kufanya kazi nyingi shambani bila wasiwasi wa mvua.';
  } else if (rainyDays === 1) {
    weekOutlook = 'Wiki hii kwa ujumla itakuwa na jua, ingawa mvua kidogo inaweza kunyesha siku moja — kaa macho.';
  } else if (rainyDays <= 3) {
    weekOutlook = `Wiki hii itakuwa na mchanganyiko wa jua na mvua — siku ${rainyDays} zinaonyesha uwezekano wa mvua, kwa hiyo panga kazi zako vizuri.`;
  } else if (rainyDays <= 5) {
    weekOutlook = `Jiandae kwa wiki yenye mvua nyingi — karibu siku ${rainyDays} kati ya 7 zinatarajiwa kuwa na mvua. Usisahau kuhifadhi mazao wazi.`;
  } else {
    weekOutlook = `Wiki hii mvua itakuwa ya kawaida sana — siku ${rainyDays} kati ya 7 zinatazamiwa kuwa na mvua. Hakikisha mifereji ya shamba iko safi.`;
  }

  // ── Peak rain — specific and actionable ───────────────────────────
  let rainNote = '';
  if (peakRain.precipitation_sum > 8) {
    const peakDay = new Date(peakRain.date + 'T12:00:00')
      .toLocaleDateString('sw-KE', { weekday: 'long' });
    rainNote = ` ${peakDay} ndiyo siku ya kuwa makini zaidi — mvua ya mm ${peakRain.precipitation_sum.toFixed(0)} inatarajiwa.`;
  } else if (peakRain.precipitation_sum > 3) {
    const peakDay = new Date(peakRain.date + 'T12:00:00')
      .toLocaleDateString('sw-KE', { weekday: 'long' });
    rainNote = ` Mvua kubwa kidogo inaweza kunyesha ${peakDay} (mm ${peakRain.precipitation_sum.toFixed(0)}).`;
  }

  // ── Wind — only mention if notable ────────────────────────────────
  let windNote = '';
  if (windyDay.wind_max > 35) {
    windNote = ` Upepo mkali wa hadi ${windyDay.wind_max} km/h unatarajiwa — angalia nyavu za kivuli na miundo inayoweza kupeperushwa.`;
  } else if (windyDay.wind_max > 22) {
    windNote = ` Upepo wa wastani wa hadi ${windyDay.wind_max} km/h unatarajiwa, kwa hiyo panga kunyunyizia asubuhi mapema.`;
  }

  // ── Crop advice — direct and personal ─────────────────────────────
  let cropNote = '';
  if (crop === 'tea' || crop === 'coffee') {
    if (tempMin != null && tempMin <= 8) {
      cropNote = ` Usiku huu baridi utasaidia ubora wa ${sw} yako — hii ni hali nzuri kwa ladha.`;
    } else if (rainyDays >= 3) {
      cropNote = ` Mvua hii itasaidia ${sw} kukua vizuri, lakini angalia ugonjwa wa ukungu katika hali hii ya unyevu.`;
    } else {
      cropNote = ` Hali hii ya hewa inafaa vizuri kwa ${sw} yako — endelea na mpango wako wa kawaida.`;
    }
  } else if (crop === 'maize' || crop === 'wheat' || crop === 'rice') {
    if (rainyDays >= 4) {
      cropNote = ` Mvua hii itafaidisha ${sw} yako sana — hakikisha mifereji iko wazi ili maji yasije yakaa mizizi.`;
    } else if (rainyDays <= 1 && tempMax != null && tempMax > 28) {
      cropNote = ` Joto na ukame unaokuja unaweza kusumbua ${sw} — fikiria kumwagilia mara moja au mbili wiki hii.`;
    } else {
      cropNote = ` Hali hii inafaa kwa ukuaji wa ${sw} — wiki nzuri ya kufanya kazi shambani.`;
    }
  } else if (crop === 'tomatoes' || crop === 'beans') {
    if (tempMax != null && tempMax > 32) {
      cropNote = ` Joto hili kali linaweza kuathiri maua ya ${sw} — mwagilia asubuhi mapema na usiku ili kupunguza msongo.`;
    } else if (rainyDays >= 3) {
      cropNote = ` Na mvua hii, angalia ${sw} yako kwa ugonjwa wa kuoza — hewa ya unyevu inachangia matatizo hayo.`;
    } else {
      cropNote = ` Wiki hii inafaa vizuri kwa ${sw} yako — fuatilia unyevu wa udongo kila siku.`;
    }
  } else if (crop === 'potatoes') {
    cropNote = rainyDays >= 3
      ? ` Viazi vinapenda unyevu, lakini maji mengi yanaweza kusababisha kuoza — hakikisha ardhi inapitisha maji vizuri.`
      : ` Angalia unyevu wa udongo — viazi vinahitaji maji ya kutosha hasa wakati wa ukuaji.`;
  } else if (crop === 'sugarcane') {
    cropNote = rainyDays >= 3
      ? ` Mvua hii itasaidia miwa yako kukua haraka — wakati mzuri wa kuachilia mbolea.`
      : ` Miwa inahitaji maji mengi — zingatia kumwagilia kama mvua haitoshi wiki hii.`;
  } else if (crop === 'flowers') {
    cropNote = windyDay.wind_max > 25
      ? ` Upepo huu unaweza kudhuru maua — funika au weka nguzo kwenye mimea inayoweza kupinduka.`
      : ` Hali hii inafaa kwa maua yako — wiki nzuri ya kupanga mazao yako kwa soko.`;
  } else if (crop === 'bananas') {
    cropNote = windyDay.wind_max > 30
      ? ` Upepo mkali unaweza kupindua miti ya ndizi — weka nguzo kwenye miti inayobeba matunda.`
      : rainyDays >= 4
      ? ` Mvua nzuri kwa ndizi, lakini angalia ugonjwa wa Fusarium katika hali hii ya unyevu mwingi.`
      : ` Hali hii inafaa kwa ndizi — hakikisha mbolea ya potassium iko ya kutosha.`;
  } else if (crop === 'greengrams') {
    cropNote = rainyDays >= 4
      ? ` Mvua nyingi inaweza kusababisha kuoza kwa ndengu — hakikisha mifereji iko safi.`
      : rainyDays === 0 && tempMax != null && tempMax > 32
      ? ` Ndengu zinastahimili ukame, lakini joto kali wakati wa maua linaweza kupunguza mavuno — mwagilia kama inawezekana.`
      : ` Hali nzuri kwa ndengu — zinastawi vizuri katika hali hii ya hewa.`;
  } else if (crop === 'cowpeas') {
    cropNote = rainyDays >= 4
      ? ` Mvua nyingi inaweza kuathiri kunde — angalia magonjwa ya ukungu na uhakikishe mifereji inafanya kazi.`
      : ` Kunde zinastahimili vizuri hali hii ya hewa — endelea na mpango wako wa kawaida.`;
  } else if (crop === 'sorghum') {
    cropNote = rainyDays === 0 && tempMax != null && tempMax > 30
      ? ` Mtama unastahimili ukame vizuri — hali hii ni ya kawaida kwa zao hili.`
      : rainyDays >= 5
      ? ` Mvua nyingi inaweza kusababisha ugonjwa wa ukungu kwenye mtama — angalia mimea kwa dalili za ugonjwa.`
      : ` Hali hii inafaa kwa mtama — wakati mzuri wa kupanda au kutia mbolea.`;
  } else if (crop === 'cassava') {
    cropNote = rainyDays >= 5
      ? ` Muhogo haupendi maji mengi — hakikisha udongo unapitisha maji vizuri ili kuzuia kuoza kwa mizizi.`
      : ` Muhogo unastahimili vizuri hali hii — endelea na matunzo ya kawaida ya shamba.`;
  } else if (crop === 'mangoes') {
    if (rainyDays >= 3 && tempMax != null && tempMax > 25) {
      cropNote = ` Hali ya unyevu na joto inaweza kusababisha ugonjwa wa batobato kwa maembe — nyunyizia dawa kwa wakati.`;
    } else if (rainyDays === 0) {
      cropNote = ` Hali kavu inafaa kwa maua ya maembe — mvua wakati wa maua inaweza kupunguza mavuno.`;
    } else {
      cropNote = ` Hali hii inafaa kwa maembe — fuatilia ukuaji wa matunda na udhibiti wa wadudu.`;
    }
  } else {
    cropNote = rainyDays <= 2
      ? ` Kwa ujumla ni wiki nzuri ya kufanya kazi nyingi shambani.`
      : ` Panga kazi zako kuzingatia siku za mvua ili kupoteza wakati kidogo.`;
  }

  return `${greeting}${addressee}! ${currentDesc} ${weekOutlook}${rainNote}${windNote}${cropNote}`;
}

export function generateSummaryEn(data: any, farmState: FarmState): string {
  const cur   = data.current  || {};
  const daily = data.daily    || [];
  const crop  = (farmState.crop || 'general').toLowerCase();
  const name  = farmState.name;
  if (!daily.length) return '';

  const today   = daily[0] || {};
  const tempMax = today.temp_max  != null ? Math.round(today.temp_max)  : null;
  const tempMin = today.temp_min  != null ? Math.round(today.temp_min)  : null;
  const curTemp = cur.temperature != null ? Math.round(cur.temperature) : tempMax;
  const condCode = cur.condition_code || today.condition_code || 0;

  const rainyDays = daily.filter((d: any) => d.precipitation_sum > 1 || d.precipitation_probability > 50).length;
  const peakRain  = daily.reduce((a: any, b: any) => (b.precipitation_sum || 0) > (a.precipitation_sum || 0) ? b : a, daily[0]);
  const windyDay  = daily.reduce((a: any, b: any) => (b.wind_max || 0) > (a.wind_max || 0) ? b : a, daily[0]);

  const CROP_EN: Record<string, string> = {
    general: 'your crops', maize: 'maize', tea: 'tea', coffee: 'coffee',
    wheat: 'wheat', rice: 'rice', beans: 'beans', tomatoes: 'tomatoes',
    potatoes: 'potatoes', sugarcane: 'sugarcane', flowers: 'flowers',
  };
  const cropEn = CROP_EN[crop] || 'your crops';

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  const addressee = name ? `, ${name}` : '';

  const isHot  = curTemp != null && curTemp >= 28;
  const isCool = curTemp != null && curTemp <= 14;
  const condFeel = isHot ? 'warm' : isCool ? 'cool' : 'mild';

  let currentDesc = '';
  if (curTemp != null && tempMax != null && tempMin != null) {
    currentDesc = `It's ${condFeel} out there today — currently ${curTemp}°C, with a high of ${tempMax}°C and an overnight low of ${tempMin}°C.`;
  } else if (curTemp != null) {
    currentDesc = `It's currently ${curTemp}°C with ${wmoText(condCode).toLowerCase()}.`;
  }

  let weekOutlook = '';
  if (rainyDays === 0) {
    weekOutlook = 'The week ahead looks completely dry — a great window to get plenty of fieldwork done without worrying about rain.';
  } else if (rainyDays === 1) {
    weekOutlook = 'Mostly sunny week ahead, though light rain could come on one day — worth keeping an eye on.';
  } else if (rainyDays <= 3) {
    weekOutlook = `Expect a mixed week — ${rainyDays} days show rain chances, so plan your field activities around the drier days.`;
  } else if (rainyDays <= 5) {
    weekOutlook = `Prepare for a wet week — around ${rainyDays} out of 7 days are expected to see rain. Make sure any harvested produce is stored safely.`;
  } else {
    weekOutlook = `It's going to be a very rainy week — ${rainyDays} of the next 7 days are forecast to have rain. Keep your field drainage clear.`;
  }

  let rainNote = '';
  if (peakRain.precipitation_sum > 8) {
    const peakDay = new Date(peakRain.date + 'T12:00:00').toLocaleDateString('en-KE', { weekday: 'long' });
    rainNote = ` ${peakDay} is the day to watch most closely — up to ${peakRain.precipitation_sum.toFixed(0)}mm of rain is expected.`;
  } else if (peakRain.precipitation_sum > 3) {
    const peakDay = new Date(peakRain.date + 'T12:00:00').toLocaleDateString('en-KE', { weekday: 'long' });
    rainNote = ` A heavier shower could come through on ${peakDay} (${peakRain.precipitation_sum.toFixed(0)}mm).`;
  }

  let windNote = '';
  if (windyDay.wind_max > 35) {
    windNote = ` Strong winds up to ${windyDay.wind_max} km/h are forecast — check shade nets and any structures that could be blown over.`;
  } else if (windyDay.wind_max > 22) {
    windNote = ` Moderate winds of up to ${windyDay.wind_max} km/h are expected, so plan any spraying for early morning when it's calmer.`;
  }

  let cropNote = '';
  if (crop === 'tea' || crop === 'coffee') {
    if (tempMin != null && tempMin <= 8) {
      cropNote = ` The cool nights (down to ${tempMin}°C) should actually benefit your ${cropEn}'s quality and flavour.`;
    } else if (rainyDays >= 3) {
      cropNote = ` The rain will help your ${cropEn} grow well this week, but keep an eye out for fungal disease in the humid conditions.`;
    } else {
      cropNote = ` Conditions look well-suited to your ${cropEn} — carry on with your usual routine.`;
    }
  } else if (crop === 'maize' || crop === 'wheat' || crop === 'rice') {
    if (rainyDays >= 4) {
      cropNote = ` Plenty of moisture coming for your ${cropEn} — just make sure drainage channels are clear so roots don't sit in standing water.`;
    } else if (rainyDays <= 1 && tempMax != null && tempMax > 28) {
      cropNote = ` The warm, dry stretch could stress your ${cropEn} — consider irrigating once or twice this week.`;
    } else {
      cropNote = ` Conditions look good for your ${cropEn} this week — a solid time to get fieldwork done.`;
    }
  } else if (crop === 'tomatoes' || crop === 'beans') {
    if (tempMax != null && tempMax > 32) {
      cropNote = ` This heat could affect flowering in your ${cropEn} — try watering in the early morning and evening to reduce stress.`;
    } else if (rainyDays >= 3) {
      cropNote = ` With all this moisture, watch your ${cropEn} closely for signs of blight or rot — humid air encourages those problems.`;
    } else {
      cropNote = ` Good conditions for your ${cropEn} this week — keep an eye on soil moisture daily.`;
    }
  } else if (crop === 'potatoes') {
    cropNote = rainyDays >= 3
      ? ` Potatoes like moisture, but too much can cause tuber rot — make sure the soil drains well.`
      : ` Keep an eye on soil moisture — potatoes need consistent water especially during bulking.`;
  } else if (crop === 'sugarcane') {
    cropNote = rainyDays >= 3
      ? ` This rain will push your sugarcane growth along nicely — a good time to top-dress with fertiliser.`
      : ` Sugarcane is thirsty — if the rain falls short this week, make sure irrigation covers the gap.`;
  } else if (crop === 'flowers') {
    cropNote = windyDay.wind_max > 25
      ? ` Wind could damage your flowers — stake or cover plants that might bend or break.`
      : ` Good conditions for your flowers this week — a nice window to prepare for market.`;
  } else if (crop === 'bananas') {
    cropNote = windyDay.wind_max > 30
      ? ` Strong winds can topple banana plants — prop up any stems that are carrying fruit before the wind arrives.`
      : rainyDays >= 4
      ? ` Good rainfall for bananas, but watch out for Fusarium wilt in these humid conditions — inspect your plants regularly.`
      : ` Conditions look good for your bananas — make sure potassium levels in your soil are adequate for healthy bunch development.`;
  } else if (crop === 'greengrams') {
    cropNote = rainyDays >= 4
      ? ` Heavy rain can cause pod rotting in green grams — make sure your drainage is working and avoid waterlogged patches.`
      : rainyDays === 0 && tempMax != null && tempMax > 32
      ? ` Green grams handle dry spells well, but intense heat during flowering can reduce your yield — irrigate if you can.`
      : ` Good conditions for your green grams this week — they should thrive in this weather.`;
  } else if (crop === 'cowpeas') {
    cropNote = rainyDays >= 4
      ? ` Too much rain can bring fungal problems to cowpeas — keep drainage clear and check plants for early signs of disease.`
      : ` Cowpeas are well-suited to these conditions — carry on with your normal field routine.`;
  } else if (crop === 'sorghum') {
    cropNote = rainyDays === 0 && tempMax != null && tempMax > 30
      ? ` Sorghum handles dry, hot conditions better than most crops — this weather is well within its comfort zone.`
      : rainyDays >= 5
      ? ` Heavy rain increases the risk of mould and smut in sorghum — scout your crop and act quickly if you see any symptoms.`
      : ` Good conditions for your sorghum this week — a solid time to top-dress or do any weeding.`;
  } else if (crop === 'cassava') {
    cropNote = rainyDays >= 5
      ? ` Cassava doesn't like waterlogged soils — check that your ridges or mounds are draining properly to protect the tubers.`
      : ` Cassava handles these conditions well — keep up with weeding, especially in the early growth stages.`;
  } else if (crop === 'mangoes') {
    if (rainyDays >= 3 && tempMax != null && tempMax > 25) {
      cropNote = ` Warm, wet conditions are ideal for anthracnose disease on mangoes — spray a protective fungicide now if you haven't already.`;
    } else if (rainyDays === 0) {
      cropNote = ` Dry weather is actually good for mango flowering — rain during flowering can cause poor fruit set, so this is a favourable spell.`;
    } else {
      cropNote = ` Reasonable conditions for your mangoes — keep an eye on fruit development and stay on top of pest scouting.`;
    }
  } else {
    cropNote = rainyDays <= 2
      ? ` Overall a good week to get plenty of fieldwork done.`
      : ` Plan your work around the rainy days to make the most of the dry spells.`;
  }

  return `${greeting}${addressee}! ${currentDesc} ${weekOutlook}${rainNote}${windNote}${cropNote}`;
}

// ── Crop Details UI data ───────────────────────────────────────────────────

export const FARM_SIZES = ['< 1 acre', '1–2 acres', '2–5 acres', '5–10 acres', '> 10 acres'];

export const SOIL_TYPES = ['Loam', 'Clay loam', 'Sandy loam', 'Black cotton', 'Volcanic', 'Sandy'];

export const CROP_VARIETIES: Record<string, string[]> = {
  maize:      ['H614D', 'H6213', 'DK8031', 'Pioneer 3253', 'SC403', 'DUMA 43'],
  beans:      ['Rose Coco', 'Mwitemania', 'GLP2', 'Lyamungu 85', 'Black Beans'],
  potatoes:   ['Shangi', 'Dutch Robijn', 'Kenya Karibu', 'Tigoni', 'Asante'],
  tomatoes:   ['Cal J', 'Rambo F1', 'Anna F1', 'Tylka F1', 'Rio Grande'],
  tea:        ['TRFK 303/577', 'TRFK 6/8', 'AHP S15/10', 'Purple Tea'],
  coffee:     ['Ruiru 11', 'Batian', 'K7', 'SL28', 'SL34'],
  wheat:      ['Eagle10', 'Kenya Fahari', 'Robin', 'Kenya Swara', 'Njoro BW II'],
  rice:       ['Basmati 370', 'NERICA 4', 'BW196', 'IR2793'],
  sugarcane:  ['CO421', 'EAI90-3', 'N14', 'N52'],
  bananas:    ['Williams', 'Grand Naine', 'Dwarf Cavendish', 'Kisubi', 'Gros Michel'],
  sorghum:    ['Serena', 'Gadam', 'KSV8', 'E1291'],
  cassava:    ['MM96/4271', 'Mkombozi', 'Tajirika', 'Kibanda Meno'],
  greengrams: ['N26', 'KS20', 'SY Quanza', 'S69'],
  cowpeas:    ['K80', 'Machakos 66', 'KVU27-1', 'M66'],
  mangoes:    ['Apple', 'Tommy Atkins', 'Kent', 'Ngowe', 'Keitt', 'Van Dyke'],
};

// ── Crop stage durations (Kenya-calibrated, days after planting) ───────────

const PERENNIAL_CROPS = new Set(['tea', 'coffee', 'bananas', 'sugarcane', 'mangoes']);

interface StageRange { name: string; nameSw: string; icon: string; from: number; to: number }

const CROP_STAGE_DURATIONS: Record<string, StageRange[]> = {
  maize: [
    { name: 'Emergence',    nameSw: 'Kuota',          icon: '🌱', from: 0,   to: 14  },
    { name: 'Vegetative',   nameSw: 'Ukuaji',         icon: '🌿', from: 15,  to: 45  },
    { name: 'Tasseling',    nameSw: 'Kutoa Tasseli',  icon: '🌽', from: 46,  to: 65  },
    { name: 'Grain Fill',   nameSw: 'Kujaza Nafaka',  icon: '🌾', from: 66,  to: 90  },
    { name: 'Maturity',     nameSw: 'Kuiva',          icon: '✅', from: 91,  to: 120 },
    { name: 'Harvest',      nameSw: 'Mavuno',         icon: '🚜', from: 121, to: 999 },
  ],
  beans: [
    { name: 'Emergence',    nameSw: 'Kuota',          icon: '🌱', from: 0,   to: 10  },
    { name: 'Vegetative',   nameSw: 'Ukuaji',         icon: '🌿', from: 11,  to: 35  },
    { name: 'Flowering',    nameSw: 'Kutoa Maua',     icon: '🌸', from: 36,  to: 55  },
    { name: 'Pod Fill',     nameSw: 'Kujaza Maganda', icon: '🫘', from: 56,  to: 75  },
    { name: 'Maturity',     nameSw: 'Kuiva',          icon: '✅', from: 76,  to: 90  },
    { name: 'Harvest',      nameSw: 'Mavuno',         icon: '🚜', from: 91,  to: 999 },
  ],
  potatoes: [
    { name: 'Emergence',         nameSw: 'Kuota',           icon: '🌱', from: 0,   to: 21  },
    { name: 'Vegetative',        nameSw: 'Ukuaji',          icon: '🌿', from: 22,  to: 45  },
    { name: 'Tuber Initiation',  nameSw: 'Kuanza kwa Viazi',icon: '🥔', from: 46,  to: 70  },
    { name: 'Tuber Bulking',     nameSw: 'Kukua kwa Viazi', icon: '🥔', from: 71,  to: 95  },
    { name: 'Maturity',          nameSw: 'Kuiva',           icon: '✅', from: 96,  to: 120 },
    { name: 'Harvest',           nameSw: 'Mavuno',          icon: '🚜', from: 121, to: 999 },
  ],
  tomatoes: [
    { name: 'Establishment', nameSw: 'Kuimarika',     icon: '🌱', from: 0,  to: 14  },
    { name: 'Vegetative',    nameSw: 'Ukuaji',        icon: '🌿', from: 15, to: 35  },
    { name: 'Flowering',     nameSw: 'Kutoa Maua',    icon: '🌸', from: 36, to: 60  },
    { name: 'Fruit Dev.',    nameSw: 'Ukuaji wa Tunda',icon: '🍅', from: 61, to: 85  },
    { name: 'Harvest',       nameSw: 'Mavuno',        icon: '🚜', from: 86, to: 999 },
  ],
  wheat: [
    { name: 'Emergence',  nameSw: 'Kuota',        icon: '🌱', from: 0,   to: 14  },
    { name: 'Tillering',  nameSw: 'Matawi',       icon: '🌿', from: 15,  to: 40  },
    { name: 'Booting',    nameSw: 'Kufunika',     icon: '🌾', from: 41,  to: 65  },
    { name: 'Heading',    nameSw: 'Kutoa Kichwa', icon: '🌾', from: 66,  to: 80  },
    { name: 'Maturity',   nameSw: 'Kuiva',        icon: '✅', from: 81,  to: 110 },
    { name: 'Harvest',    nameSw: 'Mavuno',       icon: '🚜', from: 111, to: 999 },
  ],
  rice: [
    { name: 'Seedling',      nameSw: 'Miche',          icon: '🌱', from: 0,   to: 21  },
    { name: 'Tillering',     nameSw: 'Matawi',         icon: '🌿', from: 22,  to: 50  },
    { name: 'Panicle Init.', nameSw: 'Kuanza Pamoja',  icon: '🌾', from: 51,  to: 70  },
    { name: 'Flowering',     nameSw: 'Kutoa Maua',     icon: '🌸', from: 71,  to: 85  },
    { name: 'Maturity',      nameSw: 'Kuiva',          icon: '✅', from: 86,  to: 120 },
    { name: 'Harvest',       nameSw: 'Mavuno',         icon: '🚜', from: 121, to: 999 },
  ],
  sorghum: [
    { name: 'Emergence', nameSw: 'Kuota',        icon: '🌱', from: 0,   to: 14  },
    { name: 'Vegetative',nameSw: 'Ukuaji',       icon: '🌿', from: 15,  to: 45  },
    { name: 'Booting',   nameSw: 'Kufunika',     icon: '🌾', from: 46,  to: 65  },
    { name: 'Heading',   nameSw: 'Kutoa Kichwa', icon: '🌾', from: 66,  to: 80  },
    { name: 'Maturity',  nameSw: 'Kuiva',        icon: '✅', from: 81,  to: 110 },
    { name: 'Harvest',   nameSw: 'Mavuno',       icon: '🚜', from: 111, to: 999 },
  ],
  cassava: [
    { name: 'Establishment', nameSw: 'Kuimarika',     icon: '🌱', from: 0,   to: 30  },
    { name: 'Vegetative',    nameSw: 'Ukuaji',        icon: '🌿', from: 31,  to: 90  },
    { name: 'Tuber Init.',   nameSw: 'Kuanza Mizizi', icon: '🥬', from: 91,  to: 180 },
    { name: 'Tuber Bulking', nameSw: 'Kukua Mizizi',  icon: '🥬', from: 181, to: 270 },
    { name: 'Maturity',      nameSw: 'Kuiva',         icon: '✅', from: 271, to: 360 },
    { name: 'Harvest',       nameSw: 'Mavuno',        icon: '🚜', from: 361, to: 999 },
  ],
  greengrams: [
    { name: 'Emergence', nameSw: 'Kuota',          icon: '🌱', from: 0,  to: 10  },
    { name: 'Vegetative',nameSw: 'Ukuaji',         icon: '🌿', from: 11, to: 30  },
    { name: 'Flowering', nameSw: 'Kutoa Maua',     icon: '🌸', from: 31, to: 50  },
    { name: 'Pod Fill',  nameSw: 'Kujaza Maganda', icon: '🫛', from: 51, to: 65  },
    { name: 'Maturity',  nameSw: 'Kuiva',          icon: '✅', from: 66, to: 80  },
    { name: 'Harvest',   nameSw: 'Mavuno',         icon: '🚜', from: 81, to: 999 },
  ],
  cowpeas: [
    { name: 'Emergence', nameSw: 'Kuota',          icon: '🌱', from: 0,  to: 10  },
    { name: 'Vegetative',nameSw: 'Ukuaji',         icon: '🌿', from: 11, to: 30  },
    { name: 'Flowering', nameSw: 'Kutoa Maua',     icon: '🌸', from: 31, to: 50  },
    { name: 'Pod Fill',  nameSw: 'Kujaza Maganda', icon: '🌿', from: 51, to: 65  },
    { name: 'Maturity',  nameSw: 'Kuiva',          icon: '✅', from: 66, to: 80  },
    { name: 'Harvest',   nameSw: 'Mavuno',         icon: '🚜', from: 81, to: 999 },
  ],
};

export function estimateCropStage(crop: string, plantingDate: string): CropStageResult {
  const dap = Math.floor((Date.now() - new Date(plantingDate).getTime()) / 86_400_000);

  if (PERENNIAL_CROPS.has(crop)) {
    return { name: 'Established Perennial', nameSw: 'Zao la Kudumu', icon: '🌳', daysAfterPlanting: dap, totalDays: 0, pct: 100, isPerennial: true };
  }

  const stages = CROP_STAGE_DURATIONS[crop] || CROP_STAGE_DURATIONS.maize;
  const allButLast = stages.slice(0, -1);
  const totalDays = allButLast[allButLast.length - 1]?.to ?? 120;

  const stage = stages.find(s => dap >= s.from && dap <= s.to) ?? stages[stages.length - 1];
  const pct = Math.min(100, Math.round((dap / totalDays) * 100));

  return { name: stage.name, nameSw: stage.nameSw, icon: stage.icon, daysAfterPlanting: Math.max(0, dap), totalDays, pct, isPerennial: false };
}

export function buildStageAdvice(stage: CropStageResult, risks: Risks, crop: string, irrigationType?: string): Recommendation[] {
  const recs: Recommendation[] = [];
  const n = stage.name;
  const isWet  = risks.rain.level === 'high' || risks.rain.level === 'critical';
  const isHot  = risks.temp.level === 'high' || risks.temp.level === 'critical';
  const isWindy = risks.wind.level === 'high' || risks.wind.level === 'critical';
  const irrigated = irrigationType === 'irrigated';

  if (stage.isPerennial) {
    const month = new Date().getMonth();
    if (crop === 'coffee') {
      if (month >= 2 && month <= 4) recs.push({ cls: 'good',    icon: '☕', text: 'Coffee flowering season — ensure adequate soil moisture and avoid any spraying that could affect flower set.' });
      else if (month >= 5 && month <= 8) recs.push({ cls: 'good', icon: '☕', text: 'Coffee berry development — maintain consistent moisture. This is a critical period for bean size and quality.' });
      else recs.push({ cls: 'good', icon: '☕', text: 'Good time to top-dress with CAN fertiliser if rains are reliable. Scout for coffee berry disease (CBD) regularly.' });
    } else if (crop === 'tea') {
      if (isWet) recs.push({ cls: 'caution', icon: '🍵', text: 'Wet conditions can accelerate flush growth but increase risk of blister blight. Monitor closely and spray preventatively if needed.' });
      else recs.push({ cls: 'good', icon: '🍵', text: 'Plan plucking rounds to match 7–10 day intervals. Dry spells may slow flush — adjust rounds accordingly.' });
    } else if (crop === 'bananas') {
      recs.push({ cls: isWindy ? 'warning' : 'good', icon: '🍌', text: isWindy ? 'Support banana stems bearing bunches before wind arrives — use props or ties to prevent toppling.' : 'Check bunch development. Apply potassium-rich fertiliser if plants are in active bunch-filling phase.' });
    } else if (crop === 'mangoes') {
      if (month >= 6 && month <= 8) recs.push({ cls: 'good',    icon: '🥭', text: 'Dry season — ideal for mango flowering induction. Withhold irrigation for 4–6 weeks to stress-trigger flowering.' });
      else if (isWet)               recs.push({ cls: 'caution', icon: '🥭', text: 'Warm wet weather increases anthracnose risk. Apply copper-based fungicide and ensure good canopy airflow.' });
      else                           recs.push({ cls: 'good',    icon: '🥭', text: 'Monitor fruit development and pest pressure. Thin fruits if bunches are overly heavy.' });
    } else {
      recs.push({ cls: 'good', icon: '🌳', text: 'Established crop — focus on maintenance: fertilising, pruning, and pest monitoring according to your usual schedule.' });
    }
    return recs;
  }

  // ── Annuals: stage-specific advice ──────────────────────────────────
  if (crop === 'potatoes') {
    if (n === 'Emergence') {
      recs.push({ cls: 'good', icon: '🥔', text: 'Young shoots emerging — ensure ridges are well-formed and soil is moist but not waterlogged.' });
      if (isWet) recs.push({ cls: 'caution', icon: '🌧', text: 'Excess moisture at emergence can cause seed piece rot. Check drainage and avoid compaction on ridges.' });
    } else if (n === 'Tuber Initiation') {
      if (isWet) recs.push({ cls: 'warning', icon: '⚠️', text: 'Scout for late blight (Phytophthora) now — wet conditions are ideal for infection. Spray copper-based fungicide during the next dry, low-wind window.' });
      recs.push({ cls: 'caution', icon: '🌧', text: 'Avoid overhead irrigation at this stage — use furrow or drip to reduce leaf wetness and blight pressure.' });
      if (isHot) recs.push({ cls: 'warning', icon: '🔥', text: 'High temperatures can inhibit tuber initiation. Irrigate to cool the soil and reduce heat stress.' });
    } else if (n === 'Tuber Bulking') {
      recs.push({ cls: 'good', icon: '💧', text: 'Consistent moisture is critical during bulking — any water stress now directly reduces final tuber size.' });
      if (isWet) recs.push({ cls: 'warning', icon: '⚠️', text: 'Continue blight monitoring and spraying every 7–10 days in wet weather. Stop irrigation if soil is already saturated.' });
    } else if (n === 'Maturity') {
      recs.push({ cls: 'good', icon: '✅', text: 'Reduce irrigation now to allow skins to set. Harvest when foliage has fully died back and skins are firm.' });
      if (isWet) recs.push({ cls: 'caution', icon: '🌧', text: 'Delay harvest if soils are very wet — harvest wounds in wet soils increase disease entry and storage losses.' });
    }
  } else if (crop === 'maize') {
    if (n === 'Tasseling') {
      recs.push({ cls: 'urgent', icon: '🌽', text: 'Critical pollination window — any moisture stress now directly reduces grain number and final yield.' });
      if (!irrigated) recs.push({ cls: 'warning', icon: '💧', text: 'Rain-fed: if rainfall this week is below 25mm, yield loss is likely. Consider emergency irrigation if any water source is available.' });
      if (irrigated)  recs.push({ cls: 'good',    icon: '💧', text: 'Irrigate to field capacity every 5–7 days during tasseling and silking. Morning irrigation before 9am is most effective.' });
      if (isHot)      recs.push({ cls: 'warning', icon: '🔥', text: 'Heat during pollination causes pollen sterility. There is little you can do — ensure soil moisture is maximised.' });
    } else if (n === 'Grain Fill') {
      recs.push({ cls: 'good', icon: '🌾', text: 'Grain fill is underway — maintain moisture and monitor for fall armyworm and stalk borers which peak at this stage.' });
      if (isWet) recs.push({ cls: 'caution', icon: '🌧', text: 'High humidity increases grey leaf spot and northern leaf blight risk. Scout upper leaves and act if lesions appear.' });
    } else if (n === 'Maturity') {
      if (isWet) recs.push({ cls: 'caution', icon: '🌧', text: 'Delay harvest if rains continue — damp cobs are prone to aflatoxin. Dry to 13% moisture before storage.' });
      else       recs.push({ cls: 'good',    icon: '✅', text: 'Maize approaching harvest. Check cobs for complete black layer formation before harvesting.' });
    }
  } else if (crop === 'beans') {
    if (n === 'Flowering') {
      if (isWindy) recs.push({ cls: 'warning', icon: '💨', text: 'Wind during flowering can knock flowers off before pod set. Avoid any agitation of plants and hold off spraying until calm.' });
      if (isHot)   recs.push({ cls: 'warning', icon: '🔥', text: 'Temperatures above 32°C during flowering cause pollen sterility and poor pod set. Irrigate if possible to lower canopy temperature.' });
      if (isWet)   recs.push({ cls: 'caution', icon: '🌧', text: 'Wet flowering conditions increase angular leaf spot and anthracnose risk. Apply protective fungicide and improve airflow between rows.' });
      if (!isWindy && !isHot && !isWet) recs.push({ cls: 'good', icon: '🌸', text: 'Good flowering conditions — avoid any nitrogen topdressing now as it promotes leaves over pods.' });
    } else if (n === 'Pod Fill') {
      recs.push({ cls: 'good', icon: '🫘', text: 'Maintain moisture for good pod fill. Scout for bean fly and bruchid beetles which increase at this stage.' });
    }
  } else if (crop === 'tomatoes') {
    if (n === 'Flowering') {
      if (isWindy) recs.push({ cls: 'caution', icon: '💨', text: 'Wind can reduce pollination. Consider gentle manual vibration of flower clusters in the morning to improve fruit set.' });
      if (isHot)   recs.push({ cls: 'warning', icon: '🔥', text: 'High temperatures cause blossom drop. Shade cloth or early-morning irrigation can help reduce heat stress.' });
    } else if (n === 'Fruit Dev.') {
      if (isWet)  recs.push({ cls: 'warning', icon: '🌧', text: 'Blossom end rot risk increases with fluctuating moisture. Maintain consistent irrigation and ensure calcium availability.' });
      if (isHot)  recs.push({ cls: 'caution', icon: '🔥', text: 'Fruit sunscald possible in intense heat — mulch soil to retain moisture and reduce temperature spikes.' });
      recs.push({ cls: 'good', icon: '🍅', text: 'Monitor for early blight and bacterial spot. Begin harvesting when fruit shows first colour break.' });
    }
  } else if (crop === 'wheat' || crop === 'sorghum') {
    if (n === 'Heading') {
      if (isWet)  recs.push({ cls: 'warning', icon: '⚠️', text: 'Wet conditions at heading increase risk of fusarium head blight. Apply a registered fungicide at early flowering stage.' });
      if (isWindy) recs.push({ cls: 'caution', icon: '💨', text: 'Strong winds can cause lodging at heading. Assess field for lodging risk and prioritise those areas for early harvest.' });
    } else if (n === 'Maturity') {
      if (isWet)  recs.push({ cls: 'urgent', icon: '🌧', text: 'Delay harvest if rains persist — pre-harvest sprouting and mycotoxin contamination can destroy grain quality rapidly.' });
      else        recs.push({ cls: 'good',   icon: '✅', text: 'Check grain moisture — harvest when below 14% for safe storage. Have drying arrangements in place.' });
    }
  } else if (crop === 'rice') {
    if (n === 'Flowering') {
      if (isHot)   recs.push({ cls: 'warning', icon: '🔥', text: 'Spikelet sterility occurs above 35°C at anthesis. Ensure fields are well-flooded to buffer temperature.' });
      if (isWindy) recs.push({ cls: 'caution', icon: '💨', text: 'Wind at flowering can reduce pollen transfer. Avoid any spraying during this window.' });
    } else if (n === 'Tillering') {
      recs.push({ cls: 'good', icon: '🌾', text: 'Apply nitrogen top-dressing at active tillering to maximise tiller number. Maintain shallow flooding (5–10cm).' });
      if (isWet)  recs.push({ cls: 'caution', icon: '🌧', text: 'Scout for blast disease — cool wet weather is the highest risk period. Apply tricyclazole if lesions appear.' });
    }
  } else if (crop === 'greengrams' || crop === 'cowpeas') {
    if (n === 'Flowering') {
      recs.push({ cls: 'good', icon: '🌸', text: 'Avoid nitrogen application at flowering — the crop is fixing its own nitrogen. Focus on micronutrients if leaves look pale.' });
      if (isWindy) recs.push({ cls: 'caution', icon: '💨', text: 'Hold off any spraying in windy conditions to protect pollinators and avoid flower damage.' });
    } else if (n === 'Pod Fill') {
      if (isWet) recs.push({ cls: 'warning', icon: '🌧', text: 'Pod rot risk is high in wet conditions. Improve airflow and consider harvesting in batches as pods mature.' });
    }
  } else if (crop === 'cassava') {
    if (n === 'Tuber Init.' || n === 'Tuber Bulking') {
      if (isWet) recs.push({ cls: 'warning', icon: '🌧', text: 'Waterlogged soils cause cassava root rot. Ensure ridges or mounds are draining freely and clear any blocked furrows.' });
      recs.push({ cls: 'good', icon: '🥬', text: 'Weed control is most important in the first 3 months. After this stage the canopy suppresses weeds naturally.' });
    }
  }

  if (recs.length === 0) {
    recs.push({ cls: 'good', icon: '🌱', text: `Your ${crop} is at the ${n} stage. Continue standard field management and monitor for any pest or disease symptoms.` });
  }
  return recs;
}

// Re-export for backwards compatibility
export { CROP_THRESHOLDS };
