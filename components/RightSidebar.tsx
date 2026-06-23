'use client';

import { useRef } from 'react';
import type { WeatherData, FarmState, DailyForecast, HourlyForecast, WeatherAlert, AlertSeverity } from '@/lib/types';
import { wmoIcon, fmtTemp, fmtPrecip, isDaytime, dayName, localHour, generateSummary } from '@/lib/weather-utils';

interface Props {
  weatherData: WeatherData | null;
  farmState: FarmState;
  alerts: WeatherAlert[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

// ── Tactics from AuditLog.tsx: colour-coded rows with status ──────────
const SEVERITY_STYLE: Record<AlertSeverity, { border: string; bg: string; color: string }> = {
  info:     { border: 'var(--green)',     bg: 'rgba(74,222,128,.07)',  color: 'var(--green)'     },
  warning:  { border: 'var(--amber)',     bg: 'rgba(251,191,36,.07)',  color: 'var(--amber)'     },
  high:     { border: 'var(--risk-high)', bg: 'rgba(249,115,22,.07)',  color: 'var(--risk-high)' },
  critical: { border: 'var(--risk-crit)', bg: 'rgba(239,68,68,.07)',   color: 'var(--risk-crit)' },
};

const TYPE_ICONS: Record<string, string> = {
  heavy_rain: '🌧', storm: '⛈', extreme_heat: '🔥', frost: '❄️', high_wind: '💨', unknown: '⚠️',
};
const TYPE_LABELS: Record<string, string> = {
  heavy_rain: 'Heavy Rain', storm: 'Storm', extreme_heat: 'Extreme Heat',
  frost: 'Frost Warning', high_wind: 'High Wind', unknown: 'Alert',
};

function relativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1) return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function SectionTitle({ icon, children }: { icon: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-3">
      <span style={{ fontSize: 13 }}>{icon}</span>
      <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
        {children}
      </span>
    </div>
  );
}

export default function RightSidebar({ weatherData, farmState, alerts, onDismiss, onDismissAll }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const daily   = (weatherData?.daily  ?? []) as DailyForecast[];
  const hourly  = (weatherData?.hourly ?? []) as HourlyForecast[];
  const ai      = weatherData?.ai_summary || weatherData?.summary || (weatherData ? generateSummary(weatherData, farmState) : '');
  const isDay   = isDaytime(daily);

  // Hourly: next 24h
  const now = new Date();
  let startIdx = 0;
  for (let i = 0; i < hourly.length; i++) {
    if (new Date(hourly[i].time) >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())) {
      startIdx = i; break;
    }
  }
  const next24 = hourly.slice(startIdx, startIdx + 24);

  return (
    <aside className="fc-right">

      {/* ── AI Summary ──────────────────────────────────────────── */}
      <div className="rs-section">
        <SectionTitle icon="✨">AI-Generated Summary</SectionTitle>
        {ai ? (
          <div
            className="p-3 rounded-xl text-sm leading-7 fade-in"
            style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.18)', color: 'var(--text2)' }}
          >
            {ai}
          </div>
        ) : (
          <div
            className="p-3 rounded-xl text-xs text-center"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            <div className="text-2xl mb-2">✨</div>
            <p>AI summary loads after fetching weather data.</p>
            <p className="mt-1">Requires a WeatherAI plan with AI access.</p>
          </div>
        )}
      </div>

      {/* ── Image Upload (dummy) ─────────────────────────────────── */}
      <div className="rs-section">
        <SectionTitle icon="📷">Field Photos</SectionTitle>
        <div
          className="upload-zone"
          onClick={() => fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
        >
          <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
          <p className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>Upload Field Photo</p>
          <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
            JPG or PNG · up to 10 MB
          </p>
          <div
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-semibold"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" /><line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            Choose file
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              // Dummy handler — no-op for now
              if (e.target.files?.[0]) e.target.value = '';
            }}
          />
        </div>
      </div>

      {/* ── 24-Hour Forecast ─────────────────────────────────────── */}
      <div className="rs-section">
        <SectionTitle icon="⏱">Next 24 Hours</SectionTitle>
        {next24.length > 0 ? (
          <div className="hourly-scroll fade-in">
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
                    width: 58,
                    background: i === 0 ? 'rgba(74,222,128,.12)' : 'var(--surface)',
                    border: i === 0 ? '1px solid rgba(74,222,128,.25)' : '1px solid var(--border)',
                  }}
                >
                  <div className="text-[0.6rem] mb-1" style={{ color: 'var(--muted)' }}>
                    {i === 0 ? 'Sasa' : localHour(h.time)}
                  </div>
                  <div className="text-lg mb-0.5">{wmoIcon(h.condition_code, hIsDay)}</div>
                  <div className="text-xs font-bold" style={{ color: 'var(--text)' }}>
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
        ) : (
          <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>
            Hourly forecast loads after analysis.
          </p>
        )}
      </div>

      {/* ── 7-Day Forecast ───────────────────────────────────────── */}
      <div className="rs-section">
        <SectionTitle icon="📅">7-Day Forecast</SectionTitle>
        {daily.length > 0 ? (
          <div className="fade-in">
            {daily.slice(0, 7).map(day => {
              const isToday = new Date(day.date + 'T12:00:00').toDateString() === now.toDateString();
              return (
                <div key={day.date} className="forecast-row">
                  <span
                    className="text-xs font-bold w-9 shrink-0"
                    style={{ color: isToday ? 'var(--green)' : 'var(--text2)' }}
                  >
                    {isToday ? 'Leo' : dayName(day.date)}
                  </span>
                  <span className="text-base shrink-0">{wmoIcon(day.condition_code, true)}</span>
                  <div className="flex-1 min-w-0" />
                  <span className="text-xs font-bold shrink-0" style={{ color: 'var(--text)' }}>
                    {fmtTemp(day.temp_max, farmState.units)}
                  </span>
                  <span className="text-[10px] shrink-0" style={{ color: 'var(--muted)' }}>
                    / {fmtTemp(day.temp_min, farmState.units)}
                  </span>
                  {day.precipitation_probability != null && (
                    <span className="text-[10px] shrink-0" style={{ color: 'var(--sky)' }}>
                      💧{day.precipitation_probability}%
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-xs text-center py-4" style={{ color: 'var(--muted)' }}>
            7-day forecast loads after analysis.
          </p>
        )}
      </div>

      {/* ── Alerts ──────────────────────────────────────────────── */}
      <div className="rs-section">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <span style={{ fontSize: 13 }}>🔔</span>
            <span className="text-[11px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
              Alerts
            </span>
            {alerts.length > 0 && (
              <span
                className="text-[9px] font-black px-1.5 py-0.5 rounded-full"
                style={{ background: 'rgba(239,68,68,.15)', color: 'var(--risk-crit)', border: '1px solid rgba(239,68,68,.3)' }}
              >
                {alerts.length}
              </span>
            )}
          </div>
          {alerts.length > 0 && (
            <button
              onClick={onDismissAll}
              className="text-[10px] cursor-pointer hover:opacity-70 transition-opacity"
              style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline' }}
            >
              Dismiss all
            </button>
          )}
        </div>

        {alerts.length > 0 ? (
          <div className="flex flex-col gap-1.5 fade-in">
            {alerts.slice(0, 5).map(a => {
              const s = SEVERITY_STYLE[a.severity];
              return (
                <div
                  key={a.id}
                  className="flex items-start gap-2 px-3 py-2 rounded-lg text-xs"
                  style={{ background: s.bg, border: `1px solid ${s.border}22`, borderLeft: `3px solid ${s.border}` }}
                >
                  <span className="text-sm shrink-0 mt-px">{TYPE_ICONS[a.type] ?? '⚠️'}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5 mb-0.5">
                      <span className="font-bold" style={{ color: s.color }}>{TYPE_LABELS[a.type] ?? 'Alert'}</span>
                      <span style={{ color: 'var(--muted)', fontSize: 9 }}>{relativeTime(a.receivedAt)}</span>
                    </div>
                    <p className="leading-relaxed" style={{ color: 'var(--text2)' }}>{a.message}</p>
                  </div>
                  <button
                    onClick={() => onDismiss(a.id)}
                    className="shrink-0 cursor-pointer hover:opacity-60 transition-opacity"
                    style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 11, padding: 2 }}
                  >✕</button>
                </div>
              );
            })}
            {alerts.length > 5 && (
              <p className="text-center text-[10px]" style={{ color: 'var(--muted)' }}>
                +{alerts.length - 5} more alerts
              </p>
            )}
          </div>
        ) : (
          <div
            className="text-center py-5 rounded-xl"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          >
            <div style={{ fontSize: 22, marginBottom: 8 }}>🔕</div>
            <p className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>No active alerts</p>
            <p className="text-[10px] mt-1 leading-relaxed px-2" style={{ color: 'var(--muted)' }}>
              Configure the webhook URL in Farm Setup to receive real-time WeatherAI alerts.
            </p>
          </div>
        )}
      </div>

    </aside>
  );
}
