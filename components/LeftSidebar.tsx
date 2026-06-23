'use client';

import { useState, useEffect } from 'react';
import type { WeatherData, FarmState, DailyForecast, HourlyForecast, UsageData } from '@/lib/types';
import {
  wmoIcon, wmoText, fmtTemp, fmtWind, fmtPrecip,
  isDaytime, degreesToCardinal,
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
        Enter your farm details to get a personalised 7-day forecast and crop risk analysis.
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
        <input
          className="form-input"
          placeholder="e.g. Bomet, Kenya"
          value={farmState.county}
          onChange={upd('county')}
        />
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
            Analyse Farm
          </>
        )}
      </button>

      {/* Webhook URL hint */}
      <div className="mt-2 p-3 rounded-lg" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
        <div className="text-[9px] font-bold uppercase tracking-widest mb-1.5" style={{ color: 'var(--muted)' }}>
          Webhook URL
        </div>
        <code
          className="text-[9px] block truncate"
          style={{ color: 'var(--sky)', fontFamily: 'monospace' }}
          title="Your WeatherAI webhook endpoint"
        >
          {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/backend/api/alerts/webhook
        </code>
        <p className="text-[9px] mt-1" style={{ color: 'var(--muted)' }}>
          Paste into WeatherAI → Webhooks &amp; Alerts
        </p>
      </div>
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

      {/* Quick stats */}
      <div className="p-4 grid grid-cols-2 gap-2.5">
        {[
          { icon: '💧', val: humidity != null ? humidity + '%'              : '—', lbl: 'Humidity'    },
          { icon: '💨', val: windSpeed != null ? fmtWind(windSpeed, farmState.units) + (windDir ? ' ' + windDir : '') : '—', lbl: 'Wind' },
          { icon: '☀️', val: `${uvIdx} · ${uvLbl}`,                               lbl: 'UV Index'    },
          { icon: '🌧', val: precip,                                               lbl: "Today's Rain" },
        ].map(m => (
          <div
            key={m.lbl}
            className="flex flex-col gap-0.5 p-2.5 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div className="flex items-center gap-1.5">
              <span style={{ fontSize: 13 }}>{m.icon}</span>
              <span className="text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--muted)' }}>{m.lbl}</span>
            </div>
            <div className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>{m.val}</div>
          </div>
        ))}
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
        const aiRemaining = usageData.remaining?.aiRequests ?? (aiLimit - (usageData.period?.aiRequestCount ?? 0));
        const aiUsed      = aiLimit - aiRemaining;
        const aiPct       = aiLimit > 0 ? Math.round((aiRemaining / aiLimit) * 100) : 0;

        const reqLimit     = usageData.limits?.requests ?? 0;
        const reqRemaining = usageData.remaining?.requests ?? (reqLimit - (usageData.period?.requestCount ?? 0));
        const reqPct       = reqLimit > 0 ? Math.round((reqRemaining / reqLimit) * 100) : 0;

        const periodEnd = usageData.period?.end
          ? new Date(usageData.period.end).toLocaleDateString('sw-KE', { day: 'numeric', month: 'short', year: 'numeric' })
          : null;

        const barColor = (pct: number) =>
          pct > 50 ? 'var(--green)' : pct > 20 ? 'var(--amber)' : 'var(--risk-crit)';

        return (
          <div className="px-4 py-3 border-t" style={{ borderColor: 'var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-3">
              <span style={{ fontSize: 11 }}>✨</span>
              <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                Hisa ya AI
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
                  <span className="text-[10px]" style={{ color: 'var(--text2)' }}>Maombi ya AI</span>
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
                  <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{aiUsed.toLocaleString()} zimetumika</span>
                  <span className="text-[9px]" style={{ color: 'var(--muted)' }}>{aiPct}% zimebaki</span>
                </div>
              </div>
            )}

            {/* Total Requests */}
            {reqLimit > 0 && (
              <div className="mb-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[10px]" style={{ color: 'var(--text2)' }}>Maombi Jumla</span>
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
              </div>
            )}

            {periodEnd && (
              <div className="text-[9px] mt-1" style={{ color: 'var(--muted)' }}>
                Kipindi kinaisha {periodEnd}
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
