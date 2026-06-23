'use client';

import { useState, useEffect } from 'react';
import type { WeatherData, FarmState, DailyForecast, HourlyForecast, UsageData } from '@/lib/types';
import {
  wmoIcon, wmoText, fmtTemp, fmtWind, fmtPrecip,
  isDaytime, degreesToCardinal, localHour,
} from '@/lib/weather-utils';

interface Props {
  farmState: FarmState;
  onChange: (s: FarmState) => void;
  onAnalyze: (s: FarmState) => void;
  weatherData: WeatherData | null;
  isFetching: boolean;
  isRefreshing: boolean;
  lastUpdated: Date | null;
  autoRefreshMs: number;
  crops?: { value: string; label: string }[];
  units?: { value: string; label: string }[];
  usageData?: UsageData | null;
}

const DEFAULT_UNITS = [
  { value: 'metric',   label: 'Metric (°C, km/h)' },
  { value: 'imperial', label: 'Imperial (°F, mph)' },
];

// ── Kenya county centroids (lat, lon) ────────────────────────────────
const COUNTY_COORDS: Record<string, { lat: string; lon: string }> = {
  'Baringo':          { lat: '0.84270',  lon: '36.08976' },
  'Bomet':            { lat: '-0.78171', lon: '35.34168' },
  'Bungoma':          { lat: '0.56952',  lon: '34.55920' },
  'Busia':            { lat: '0.43484',  lon: '34.24199' },
  'Elgeyo-Marakwet':  { lat: '0.98830',  lon: '35.51090' },
  'Embu':             { lat: '-0.53019', lon: '37.45048' },
  'Garissa':          { lat: '-0.45350', lon: '39.64601' },
  'Homa Bay':         { lat: '-0.52717', lon: '34.45776' },
  'Isiolo':           { lat: '0.35248',  lon: '38.00167' },
  'Kajiado':          { lat: '-2.09820', lon: '36.78196' },
  'Kakamega':         { lat: '0.28422',  lon: '34.75196' },
  'Kericho':          { lat: '-0.36894', lon: '35.28627' },
  'Kiambu':           { lat: '-1.03128', lon: '36.86702' },
  'Kilifi':           { lat: '-3.51004', lon: '39.90992' },
  'Kirinyaga':        { lat: '-0.55898', lon: '37.27702' },
  'Kisii':            { lat: '-0.68171', lon: '34.76610' },
  'Kisumu':           { lat: '-0.10220', lon: '34.76176' },
  'Kitui':            { lat: '-1.36667', lon: '38.01667' },
  'Kwale':            { lat: '-4.17387', lon: '39.45202' },
  'Laikipia':         { lat: '0.20167',  lon: '36.90000' },
  'Lamu':             { lat: '-2.26852', lon: '40.90200' },
  'Machakos':         { lat: '-1.51773', lon: '37.26327' },
  'Makueni':          { lat: '-1.99913', lon: '37.62048' },
  'Mandera':          { lat: '3.94167',  lon: '41.86667' },
  'Marsabit':         { lat: '2.33333',  lon: '37.98333' },
  'Meru':             { lat: '0.04674',  lon: '37.64941' },
  'Migori':           { lat: '-1.06346', lon: '34.47319' },
  'Mombasa':          { lat: '-4.05466', lon: '39.66359' },
  "Murang'a":         { lat: '-0.78326', lon: '37.02765' },
  'Nairobi':          { lat: '-1.28333', lon: '36.81667' },
  'Nakuru':           { lat: '-0.30310', lon: '36.08011' },
  'Nandi':            { lat: '0.18366',  lon: '35.12957' },
  'Narok':            { lat: '-1.08178', lon: '35.87120' },
  'Nyamira':          { lat: '-0.56700', lon: '34.93500' },
  'Nyandarua':        { lat: '-0.18235', lon: '36.52180' },
  'Nyeri':            { lat: '-0.41654', lon: '36.94798' },
  'Samburu':          { lat: '1.20000',  lon: '36.90000' },
  'Siaya':            { lat: '-0.06099', lon: '34.28778' },
  'Taita-Taveta':     { lat: '-3.31584', lon: '38.35734' },
  'Tana River':       { lat: '-1.60000', lon: '39.65000' },
  'Tharaka-Nithi':    { lat: '-0.29667', lon: '37.92250' },
  'Trans Nzoia':      { lat: '1.05641',  lon: '34.95069' },
  'Turkana':          { lat: '3.11720',  lon: '35.59580' },
  'Uasin Gishu':      { lat: '0.55272',  lon: '35.26988' },
  'Vihiga':           { lat: '0.07670',  lon: '34.72302' },
  'Wajir':            { lat: '1.74718',  lon: '40.05745' },
  'West Pokot':       { lat: '1.62082',  lon: '35.38705' },
};

// ── Setup form (no data yet, or editing) ─────────────────────────────
function SetupForm({ farmState, onChange, onAnalyze, isFetching, units, onCancel, hasData }: {
  farmState: FarmState;
  onChange: (s: FarmState) => void;
  onAnalyze: (s: FarmState) => void;
  isFetching: boolean;
  units?: { value: string; label: string }[];
  onCancel?: () => void;
  hasData: boolean;
}) {
  const upd = (key: keyof FarmState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...farmState, [key]: e.target.value });

  const handleCountyChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const county = e.target.value;
    const coords = COUNTY_COORDS[county];
    onChange({ ...farmState, county, ...(coords ?? {}) });
  };

  const unitList = units ?? DEFAULT_UNITS;

  const geolocate = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => onChange({ ...farmState, lat: pos.coords.latitude.toFixed(5), lon: pos.coords.longitude.toFixed(5) }),
        () => {},
        { timeout: 6000 },
      );
    }
  };

  return (
    <div className="p-4 flex flex-col gap-3">
      {/* Header */}
      <div className="flex items-center justify-between mb-1">
        <div className="flex items-center gap-2">
          <div
            style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(74,222,128,.15)', border: '1px solid rgba(74,222,128,.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14 }}
          >🏡</div>
          <span className="text-sm font-bold" style={{ color: 'var(--text)' }}>Farm Setup</span>
        </div>
        {hasData && onCancel && (
          <button
            onClick={onCancel}
            className="text-xs cursor-pointer hover:opacity-70 transition-opacity"
            style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline' }}
          >Cancel</button>
        )}
      </div>

      <p className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>
        Tell us about your farm and we'll deliver a real-time 7-day forecast, crop-specific risk alerts, and field-level recommendations — tailored to your location and what you're growing.
      </p>

      <div className="h-px" style={{ background: 'var(--border)' }} />

      {/* Farm Name */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Farm Name</label>
        <input
          className="form-input"
          placeholder="e.g. Kapkimolwa Farm"
          value={farmState.name}
          onChange={upd('name')}
        />
      </div>

      {/* County */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>County / Region</label>
        <select
          className="form-input"
          value={farmState.county}
          onChange={handleCountyChange}
          style={{ cursor: 'pointer' }}
        >
          <option value="">— Select county —</option>
          {[
            'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
            'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
            'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
            'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa','Murang\'a',
            'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri',
            'Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
            'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
          ].map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      {/* Lat / Lon + Geolocation */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Location</label>
          <button
            onClick={geolocate}
            className="flex items-center gap-1 text-[10px] cursor-pointer hover:opacity-70 transition-opacity"
            style={{ background: 'none', border: 'none', color: 'var(--green)' }}
            title="Use my current location"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="3" />
              <path d="M12 2v4m0 12v4m10-10h-4M6 12H2" />
            </svg>
            Auto-detect
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            className="form-input"
            type="number" step="any" placeholder="Lat (-0.789)"
            value={farmState.lat} onChange={upd('lat')}
          />
          <input
            className="form-input"
            type="number" step="any" placeholder="Lon (35.78)"
            value={farmState.lon} onChange={upd('lon')}
          />
        </div>
      </div>

      {/* Units */}
      <div className="flex flex-col gap-1">
        <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>Units</label>
        <select className="form-input" value={farmState.units} onChange={upd('units') as any}>
          {unitList.map(u => (
            <option key={u.value} value={u.value} style={{ background: 'var(--bg2)' }}>{u.label}</option>
          ))}
        </select>
      </div>

      {/* Analyze button */}
      <button
        onClick={() => onAnalyze(farmState)}
        disabled={isFetching}
        className="flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-black text-sm tracking-wide cursor-pointer transition-all hover:opacity-90 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed mt-1"
        style={{ background: isFetching ? 'var(--surface)' : 'var(--green)', border: 'none', color: isFetching ? 'var(--muted)' : '#0c1a0e' }}
      >
        {isFetching ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: 'spin .7s linear infinite' }}>
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            Fetching data…
          </>
        ) : (
          <>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
            </svg>
            Analyze Farm
          </>
        )}
      </button>

    </div>
  );
}

// ── Countdown hook ────────────────────────────────────────────────────
function useCountdown(lastUpdated: Date | null, autoRefreshMs: number) {
  const [countdown, setCountdown] = useState('--:--');
  const [pct, setPct] = useState(100);

  useEffect(() => {
    if (!lastUpdated || !autoRefreshMs) return;
    const tick = () => {
      const remaining = Math.max(0, autoRefreshMs - (Date.now() - lastUpdated.getTime()));
      const m = Math.floor(remaining / 60_000);
      const s = Math.floor((remaining % 60_000) / 1000);
      setCountdown(`${m}:${s.toString().padStart(2, '0')}`);
      setPct(Math.round((remaining / autoRefreshMs) * 100));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastUpdated, autoRefreshMs]);

  return { countdown, pct };
}

// ── Weather summary (data loaded) ─────────────────────────────────────
function WeatherSummary({ farmState, weatherData, lastUpdated, autoRefreshMs, isRefreshing, onEdit, usageData }: {
  farmState: FarmState;
  weatherData: WeatherData;
  lastUpdated: Date | null;
  autoRefreshMs: number;
  isRefreshing: boolean;
  onEdit: () => void;
  usageData?: UsageData | null;
}) {
  const { countdown, pct } = useCountdown(lastUpdated, autoRefreshMs);
  const daily   = (weatherData.daily  ?? []) as DailyForecast[];
  const hourly  = (weatherData.hourly ?? []) as HourlyForecast[];
  const cur     = weatherData.current ?? {};
  const loc     = weatherData.location ?? {};
  const isDay   = isDaytime(daily);

  const now     = new Date();
  const curHour = hourly.find(h => {
    const d = new Date(h.time);
    return d.toDateString() === now.toDateString() && d.getHours() === now.getHours();
  }) || hourly[0] || {} as HourlyForecast;

  const temp       = cur.temperature ?? curHour.temperature ?? 0;
  const condCode   = cur.condition_code ?? curHour.condition_code ?? 0;
  const feelsLike  = curHour.feels_like;
  const humidity   = curHour.humidity;
  const windSpeed  = cur.wind_speed ?? curHour.wind_speed;
  const windDir    = degreesToCardinal(cur.wind_direction ?? curHour.wind_direction);
  const uvIdx      = curHour.uv_index ?? 0;
  const uvLbl      = uvIdx <= 2 ? 'Low' : uvIdx <= 5 ? 'Moderate' : uvIdx <= 7 ? 'High' : 'Very High';
  const precip     = daily[0] ? fmtPrecip(daily[0].precipitation_sum, farmState.units) : '—';

  const initial = (farmState.name || 'F').charAt(0).toUpperCase();
  const barColor = pct > 50 ? 'var(--green)' : pct > 25 ? 'var(--amber)' : 'var(--risk-crit)';
  const locationStr = [farmState.county || loc.city, loc.country].filter(Boolean).join(', ') || '—';

  return (
    <div className="flex flex-col">
      {/* Farmer identity */}
      <div className="p-4 pb-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            {/* Avatar */}
            <div
              className="flex items-center justify-center font-black text-xl rounded-full shrink-0"
              style={{
                width: 44, height: 44,
                background: 'linear-gradient(135deg, rgba(74,222,128,.25) 0%, rgba(34,197,94,.15) 100%)',
                border: '2px solid rgba(74,222,128,.4)',
                color: 'var(--green)',
              }}
            >
              {initial}
            </div>
            <div>
              <div className="text-sm font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {farmState.name || 'My Farm'}
              </div>
              <div className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                {locationStr}
              </div>
            </div>
          </div>
          <button
            onClick={onEdit}
            className="flex items-center gap-1 text-xs cursor-pointer hover:opacity-70 transition-opacity px-2.5 py-1.5 rounded-lg"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
            title="Edit farm details"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
            </svg>
            Edit
          </button>
        </div>
      </div>

      <div className="h-px mx-4" style={{ background: 'var(--border)' }} />

      {/* Big current temp */}
      <div className="p-4 pb-2">
        <div className="flex items-start justify-between">
          <div>
            <div
              className="font-extralight leading-none tracking-[-4px]"
              style={{ fontSize: 'clamp(3.5rem,10vw,5rem)', color: 'var(--text)' }}
            >
              {fmtTemp(temp, farmState.units)}
            </div>
            <div className="mt-1.5 text-base font-semibold" style={{ color: 'var(--sky)' }}>
              {wmoText(condCode)}
            </div>
            {feelsLike != null && (
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>
                Feels like {fmtTemp(feelsLike, farmState.units)}
              </div>
            )}
          </div>
          <div style={{ fontSize: 'clamp(3rem,8vw,4rem)', lineHeight: 1, marginTop: 4 }}>
            {wmoIcon(condCode, isDay)}
          </div>
        </div>
      </div>

      <div className="h-px mx-4" style={{ background: 'var(--border)' }} />

      {/* Next 24 Hours */}
      <div className="px-4 pt-3 pb-2">
        <div className="flex items-center gap-1.5 mb-2.5">
          <span style={{ fontSize: 12 }}>⏱</span>
          <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
            Next 24 Hours
          </span>
        </div>
        {(() => {
          let startIdx = 0;
          for (let i = 0; i < hourly.length; i++) {
            const d = new Date(hourly[i].time);
            if (d >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())) {
              startIdx = i; break;
            }
          }
          const next24 = hourly.slice(startIdx, startIdx + 24);
          if (!next24.length) return (
            <p className="text-[10px] py-2" style={{ color: 'var(--muted)' }}>
              Hourly forecast loads after analysis.
            </p>
          );
          return (
            <div className="hourly-scroll">
              {next24.map((h, i) => {
                let hIsDay = isDay;
                if (daily.length) {
                  const hDate = new Date(h.time);
                  const dayEntry = daily.find(d => d.date === hDate.toISOString().slice(0, 10));
                  if (dayEntry?.sunrise && dayEntry?.sunset) {
                    hIsDay = hDate >= new Date(dayEntry.sunrise) && hDate <= new Date(dayEntry.sunset);
                  }
                }
                return (
                  <div
                    key={h.time}
                    className="flex-none rounded-xl py-2.5 px-1.5 text-center"
                    style={{
                      width: 52,
                      background: i === 0 ? 'rgba(74,222,128,.12)' : 'var(--surface)',
                      border: i === 0 ? '1px solid rgba(74,222,128,.25)' : '1px solid var(--border)',
                    }}
                  >
                    <div className="text-[0.6rem] mb-1" style={{ color: 'var(--muted)' }}>
                      {i === 0 ? 'Sasa' : localHour(h.time)}
                    </div>
                    <div className="text-lg mb-0.5">{wmoIcon(h.condition_code, hIsDay)}</div>
                    <div className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>
                      {fmtTemp(h.temperature, farmState.units)}
                    </div>
                    {h.precipitation_probability != null && (
                      <div className="text-[0.58rem] mt-0.5" style={{ color: 'var(--sky)' }}>
                        💧{h.precipitation_probability}%
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        })()}
      </div>

      <div className="h-px mx-4" style={{ background: 'var(--border)' }} />

      {/* Refresh countdown */}
      <div className="px-4 py-3">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--muted)' }}>
            {isRefreshing ? 'Refreshing now…' : 'Next refresh'}
          </span>
          <span className="text-[10px] font-mono font-bold" style={{ color: 'var(--text2)' }}>
            {isRefreshing ? '…' : countdown}
          </span>
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
          <div
            className="h-full rounded-full transition-all duration-1000"
            style={{ width: pct + '%', background: barColor }}
          />
        </div>
        {lastUpdated && (
          <div className="text-[10px] mt-1.5" style={{ color: 'var(--muted)' }}>
            Last updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </div>
        )}
      </div>

      {/* ── AI Quota ───────────────────────────────────────────────── */}
      {usageData && (usageData.limits?.aiRequests != null || usageData.limits?.requests != null) && (() => {
        const aiLimit     = usageData.limits?.aiRequests ?? 0;
        const aiUsed      = usageData.period?.aiRequestCount
          ?? Math.max(0, aiLimit - (usageData.remaining?.aiRequests ?? aiLimit));
        const aiRemaining = Math.max(0, usageData.remaining?.aiRequests ?? (aiLimit - aiUsed));
        const aiPct       = aiLimit > 0 ? Math.min(100, Math.round((aiRemaining / aiLimit) * 100)) : 0;

        const reqLimit     = usageData.limits?.requests ?? 0;
        const reqUsed      = usageData.period?.requestCount
          ?? Math.max(0, reqLimit - (usageData.remaining?.requests ?? reqLimit));
        const reqRemaining = Math.max(0, usageData.remaining?.requests ?? (reqLimit - reqUsed));
        const reqPct       = reqLimit > 0 ? Math.min(100, Math.round((reqRemaining / reqLimit) * 100)) : 0;

        const periodEnd = usageData.period?.end
          ? new Date(usageData.period.end).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
          : null;

        const barColor = (pct: number) =>
          pct > 50 ? 'var(--green)' : pct > 20 ? 'var(--amber)' : 'var(--risk-crit)';

        return (
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <span style={{ fontSize: 11 }}>✨</span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                AI Usage Quota
              </span>
              {usageData.plan && (
                <span
                  className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase tracking-wide"
                  style={{ background: 'rgba(74,222,128,.12)', color: 'var(--green)', border: '1px solid rgba(74,222,128,.25)' }}
                >
                  {usageData.plan}
                </span>
              )}
            </div>

            {/* AI Requests */}
            {aiLimit > 0 && (
              <div className="mb-2.5">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px]" style={{ color: 'var(--text2)' }}>AI Requests</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: barColor(aiPct) }}>
                    {aiRemaining.toLocaleString()} / {aiLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: aiPct + '%', background: barColor(aiPct) }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{aiUsed.toLocaleString()} used</span>
                  <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{aiPct}% remaining</span>
                </div>
              </div>
            )}

            {/* Total Requests */}
            {reqLimit > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px]" style={{ color: 'var(--text2)' }}>Total Requests</span>
                  <span className="text-[10px] font-mono font-bold" style={{ color: barColor(reqPct) }}>
                    {reqRemaining.toLocaleString()} / {reqLimit.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: reqPct + '%', background: barColor(reqPct) }}
                  />
                </div>
                <div className="flex justify-between mt-0.5">
                  <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{reqUsed.toLocaleString()} used</span>
                  <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{reqPct}% remaining</span>
                </div>
              </div>
            )}

            {periodEnd && (
              <div className="text-[9px] mt-1" style={{ color: 'var(--muted)' }}>
                Period ends {periodEnd}
              </div>
            )}
          </div>
        );
      })()}
    </div>
  );
}

// ── Main export ────────────────────────────────────────────────────────
export default function LeftSidebar({
  farmState, onChange, onAnalyze, weatherData,
  isFetching, isRefreshing, lastUpdated, autoRefreshMs,
  crops, units, usageData,
}: Props) {
  const [editMode, setEditMode] = useState(false);
  const showForm = !weatherData || editMode;

  return (
    <aside className="fc-left">
      {showForm ? (
        <SetupForm
          farmState={farmState}
          onChange={onChange}
          onAnalyze={(s) => { onAnalyze(s); setEditMode(false); }}
          isFetching={isFetching}
          units={units}
          hasData={!!weatherData}
          onCancel={weatherData ? () => setEditMode(false) : undefined}
        />
      ) : (
        <WeatherSummary
          farmState={farmState}
          weatherData={weatherData!}
          lastUpdated={lastUpdated}
          autoRefreshMs={autoRefreshMs}
          isRefreshing={isRefreshing}
          onEdit={() => setEditMode(true)}
          usageData={usageData}
        />
      )}
    </aside>
  );
}
