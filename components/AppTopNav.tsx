'use client';

import { useClerk, useUser } from '@clerk/nextjs';
import type { WeatherData, FarmState, DailyForecast } from '@/lib/types';
import { computeRisks, wmoIcon, fmtTemp, isDaytime } from '@/lib/weather-utils';

interface Props {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  farmState: FarmState;
  weatherData: WeatherData | null;
  isRefreshing: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onResetCache: () => void;
}

const RISK_PILL: Record<string, { cls: string; label: string }> = {
  low:      { cls: 'pill-safe',     label: '🌾 Fields Safe'   },
  moderate: { cls: 'pill-moderate', label: '👀 Monitor Today' },
  high:     { cls: 'pill-high',     label: '⚠️ Take Action'   },
  critical: { cls: 'pill-critical', label: '🚨 Act Now'       },
};

export default function AppTopNav({
  theme, onThemeToggle, farmState, weatherData, isRefreshing, isFetching, onRefresh, onResetCache,
}: Props) {
  const { signOut } = useClerk();
  const { user }    = useUser();

  const handleSignOut = () => {
    localStorage.removeItem('fc-farm');
    localStorage.removeItem('fc-theme');
    signOut({ redirectUrl: '/sign-in' });
  };
  const daily    = (weatherData?.daily ?? []) as DailyForecast[];
  const cur      = weatherData?.current ?? {};
  const isDay    = isDaytime(daily);

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
    <header
      className="fc-topnav flex items-center gap-4 px-5"
      style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
    >
      {/* Logo */}
      <div className="flex items-center gap-2.5 shrink-0">
        <div
          style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 17, boxShadow: '0 0 16px rgba(74,222,128,.4)',
          }}
        >🌿</div>
        <div>
          <div
            className="font-black text-base tracking-tight leading-none"
            style={{
              background: 'linear-gradient(135deg, var(--green) 0%, #a3e635 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            FieldCropCast
          </div>
          <div className="text-[9px] leading-none mt-0.5 font-medium" style={{ color: 'var(--muted)' }}>
            Farm Weather Intelligence
          </div>
        </div>
      </div>

      {/* Center: farm identity + status */}
      <div className="flex-1 flex items-center justify-center gap-3 overflow-hidden min-w-0">
        {(farmState.name || farmState.county) && (
          <div
            className="flex items-center gap-0 rounded-lg overflow-hidden shrink-0"
            style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
          >
            {farmState.name && (
              <span
                className="text-xs font-bold px-2.5 py-1"
                style={{ color: 'var(--text)' }}
              >
                {farmState.name}
              </span>
            )}
            {farmState.name && farmState.county && (
              <span
                className="self-stretch w-px"
                style={{ background: 'var(--border)' }}
              />
            )}
            {farmState.county && (
              <span
                className="flex items-center gap-1 px-2.5 py-1 text-xs"
                style={{ color: 'var(--muted)' }}
              >
                <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                {farmState.county}
              </span>
            )}
          </div>
        )}

        {weatherData && pill && (
          <>
            <span style={{ color: 'var(--border)', flexShrink: 0 }}>·</span>
            <span className={`status-pill ${pill.cls}`}>
              <span className="w-1.5 h-1.5 rounded-full pulse-dot shrink-0" style={{ background: 'currentColor' }} />
              {pill.label}
            </span>
          </>
        )}

        {weatherData && tempDisp && (
          <>
            <span style={{ color: 'var(--border)', flexShrink: 0 }}>·</span>
            <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text2)' }}>
              {wmoIcon(condCode, isDay)} {tempDisp}
            </span>
          </>
        )}

        {(isFetching || isRefreshing) && (
          <span
            className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full shrink-0"
            style={{ background: 'rgba(74,222,128,.10)', color: 'var(--green)', border: '1px solid rgba(74,222,128,.2)' }}
          >
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: 'spin .7s linear infinite' }}>
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isFetching ? 'Fetching…' : 'Updating…'}
          </span>
        )}
      </div>

      {/* Right: controls */}
      <div className="flex items-center gap-2 shrink-0">
        <button
          onClick={onResetCache}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          title="Clear all saved farm data and start fresh"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
          Reset Cache
        </button>

        <button
          onClick={onRefresh}
          disabled={isRefreshing || isFetching || !weatherData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--green)' }}
          title="Refresh weather data now"
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ animation: isRefreshing ? 'spin .7s linear infinite' : 'none', flexShrink: 0 }}>
            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          {isRefreshing ? 'Refreshing…' : 'Refresh'}
        </button>

        <button
          onClick={onThemeToggle}
          className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
          title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          <span style={{ fontSize: 14 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
        </button>

        <button
          onClick={handleSignOut}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
          style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#ef4444' }}
          title={`Sign out${user?.primaryEmailAddress?.emailAddress ? ' · ' + user.primaryEmailAddress.emailAddress : ''}`}
        >
          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Sign Out
        </button>
      </div>
    </header>
  );
}
