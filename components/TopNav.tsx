'use client';

import type { WeatherData, FarmState, DailyForecast } from '@/lib/types';
import { computeRisks, wmoIcon, fmtTemp, isDaytime } from '@/lib/weather-utils';

interface Props {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  farmState: FarmState;
  weatherData: WeatherData | null;
  alertCount: number;
  isRefreshing: boolean;
  isFetching: boolean;
  onLeftToggle: () => void;
  onRightToggle: () => void;
}

const RISK_PILL: Record<string, { cls: string; label: string }> = {
  low:      { cls: 'pill-safe',     label: '🌾 Fields Safe'    },
  moderate: { cls: 'pill-moderate', label: '👀 Monitor Today'  },
  high:     { cls: 'pill-high',     label: '⚠️ Take Action'    },
  critical: { cls: 'pill-critical', label: '🚨 Act Now'        },
};

export default function TopNav({
  theme, onThemeToggle, farmState, weatherData,
  alertCount, isRefreshing, isFetching,
  onLeftToggle, onRightToggle,
}: Props) {
  const daily = (weatherData?.daily ?? []) as DailyForecast[];
  const cur   = weatherData?.current ?? {};
  const isDay = isDaytime(daily);

  const risks = daily.length
    ? computeRisks(daily, farmState.crop || 'general', farmState.units)
    : null;

  const worstLevel = risks
    ? ([risks.rain, risks.wind, risks.temp] as const).slice().sort((a, b) => b.score - a.score)[0].level
    : null;

  const pill     = worstLevel ? RISK_PILL[worstLevel] : null;
  const condCode = cur.condition_code ?? 0;
  const tempDisp = cur.temperature != null ? fmtTemp(cur.temperature, farmState.units) : null;

  return (
    <nav
      className="layout-top flex items-center gap-2 px-3"
      style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
    >
      {/* Mobile: left panel toggle */}
      <button
        onClick={onLeftToggle}
        className="panel-toggle items-center justify-center w-8 h-8 rounded-lg cursor-pointer shrink-0 transition-opacity hover:opacity-70"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
        title="Farm setup"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
        </svg>
      </button>

      {/* Logo */}
      <div className="flex items-center gap-2 shrink-0">
        <div
          className="w-7 h-7 rounded-lg flex items-center justify-center"
          style={{
            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
            boxShadow: '0 0 12px rgba(74,222,128,.35)',
          }}
        >
          <span style={{ fontSize: 14 }}>🌿</span>
        </div>
        <span
          className="font-black text-base tracking-tight"
          style={{
            background: 'linear-gradient(135deg, var(--green) 0%, #a3e635 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text',
          }}
        >
          FieldCropCast
        </span>
      </div>

      {/* Center status */}
      <div className="flex-1 flex items-center justify-center gap-3 overflow-hidden min-w-0">
        {weatherData && !isFetching ? (
          <>
            {pill && (
              <span className={`status-pill ${pill.cls}`}>
                <span className="w-1.5 h-1.5 rounded-full pulse-dot shrink-0" style={{ background: 'currentColor' }} />
                {pill.label}
              </span>
            )}

            <div className="hidden items-center gap-2 text-sm overflow-hidden" style={{ display: 'flex' }}>
              {farmState.name && (
                <span
                  className="font-semibold truncate"
                  style={{ color: 'var(--green)', maxWidth: 160 }}
                >
                  {farmState.name}
                </span>
              )}
              {tempDisp && (
                <>
                  <span style={{ color: 'var(--border)', flexShrink: 0 }}>·</span>
                  <span className="shrink-0 text-sm" style={{ color: 'var(--text2)' }}>
                    {wmoIcon(condCode, isDay)} {tempDisp}
                  </span>
                </>
              )}
            </div>

            {isRefreshing && (
              <span
                className="hidden items-center gap-1.5 text-xs px-2.5 py-1 rounded-full shrink-0"
                style={{
                  display: 'flex',
                  background: 'rgba(74,222,128,.10)',
                  color: 'var(--green)',
                  border: '1px solid rgba(74,222,128,.2)',
                }}
              >
                <svg
                  width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'spin .7s linear infinite' }}
                >
                  <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Updating
              </span>
            )}
          </>
        ) : isFetching ? (
          <div className="flex items-center gap-2 text-xs" style={{ color: 'var(--muted)' }}>
            <div
              className="w-3 h-3 rounded-full border-2 shrink-0"
              style={{ borderColor: 'var(--border)', borderTopColor: 'var(--green)', animation: 'spin .7s linear infinite' }}
            />
            Fetching weather data…
          </div>
        ) : (
          <p className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
            Your Farm&rsquo;s Weather Intelligence
          </p>
        )}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-1.5 shrink-0">
        {/* Alert bell */}
        {alertCount > 0 && (
          <button
            onClick={onRightToggle}
            className="relative flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer"
            style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)' }}
            title={`${alertCount} active alert${alertCount !== 1 ? 's' : ''}`}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="var(--risk-crit)" strokeWidth="2.5">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            <span
              className="absolute -top-1 -right-1 w-4 h-4 rounded-full flex items-center justify-center font-black"
              style={{ background: 'var(--risk-crit)', color: '#fff', fontSize: 9 }}
            >
              {alertCount > 9 ? '9+' : alertCount}
            </span>
          </button>
        )}

        {/* Mobile: right panel toggle (when no alerts showing the bell) */}
        {alertCount === 0 && (
          <button
            onClick={onRightToggle}
            className="panel-toggle items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            title="Stats & alerts"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
          </button>
        )}

        {/* Theme toggle */}
        <button
          onClick={onThemeToggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        >
          <span style={{ fontSize: 14 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>
      </div>
    </nav>
  );
}
