'use client';

import { useState, useEffect } from 'react';

interface Props {
  lastUpdated: Date | null;
  autoRefreshMs: number;
  isRefreshing: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  hasData: boolean;
  plan?: string;
}

export default function BottomNav({
  lastUpdated, autoRefreshMs, isRefreshing, isFetching, onRefresh, hasData, plan,
}: Props) {
  const [countdown, setCountdown] = useState('--:--');
  const [progressPct, setProgressPct] = useState(100);

  useEffect(() => {
    if (!lastUpdated || !autoRefreshMs) {
      setCountdown('--:--');
      setProgressPct(100);
      return;
    }
    const tick = () => {
      const elapsed   = Date.now() - lastUpdated.getTime();
      const remaining = Math.max(0, autoRefreshMs - elapsed);
      const mins = Math.floor(remaining / 60_000);
      const secs = Math.floor((remaining % 60_000) / 1000);
      setCountdown(`${mins}:${secs.toString().padStart(2, '0')}`);
      setProgressPct(Math.round((remaining / autoRefreshMs) * 100));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [lastUpdated, autoRefreshMs]);

  const updatedStr = lastUpdated
    ? lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    : null;

  const barColor = progressPct > 50 ? 'var(--green)' : progressPct > 25 ? 'var(--amber)' : 'var(--risk-crit)';

  return (
    <div
      className="layout-bottom flex items-center gap-3 px-4"
      style={{ background: 'var(--bg2)', borderTop: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
    >
      {/* Left: brand + plan badge */}
      <div className="flex items-center gap-2 shrink-0">
        <span className="text-xs" style={{ color: 'var(--muted)' }}>
          <span className="hidden sm:inline">Powered by </span>WeatherAI
        </span>
        {plan && (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{
              background: 'rgba(74,222,128,.10)',
              color: 'var(--green)',
              border: '1px solid rgba(74,222,128,.25)',
            }}
          >
            {plan}
          </span>
        )}
      </div>

      {/* Center: refresh countdown */}
      {hasData && (
        <div className="flex-1 flex items-center justify-center gap-2.5 overflow-hidden min-w-0">
          <div className="flex items-center gap-1.5 text-xs shrink-0" style={{ color: 'var(--muted)' }}>
            <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
            </svg>
            <span className="hidden sm:inline">Next:</span>
          </div>
          <span className="text-xs font-mono font-bold shrink-0" style={{ color: 'var(--text2)' }}>
            {isRefreshing ? (
              <span style={{ color: 'var(--green)' }}>Refreshing…</span>
            ) : countdown}
          </span>
          <div className="flex-1 h-1 rounded-full overflow-hidden max-w-[120px]" style={{ background: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-1000"
              style={{ width: progressPct + '%', background: barColor }}
            />
          </div>
        </div>
      )}

      {/* Right: last updated + refresh button */}
      <div className="flex items-center gap-2 shrink-0 ml-auto">
        {updatedStr && (
          <span className="text-xs hidden md:inline" style={{ color: 'var(--muted)' }}>
            {updatedStr}
          </span>
        )}
        <button
          onClick={onRefresh}
          disabled={isRefreshing || isFetching || !hasData}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            color: isRefreshing ? 'var(--muted)' : 'var(--green)',
          }}
          title="Refresh weather data now"
        >
          <svg
            width="11" height="11" viewBox="0 0 24 24"
            fill="none" stroke="currentColor" strokeWidth="2.5"
            style={{ animation: isRefreshing ? 'spin .7s linear infinite' : 'none', flexShrink: 0 }}
          >
            <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
            <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
          </svg>
          <span className="hidden sm:inline">{isRefreshing ? 'Refreshing…' : 'Refresh'}</span>
        </button>
      </div>
    </div>
  );
}
