'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { WeatherData, FarmState, UsageData, WeatherAlert } from '@/lib/types';
import Header from '@/components/Header';
import SetupForm from '@/components/SetupForm';
import Dashboard from '@/components/Dashboard';
import AlertsBanner from '@/components/AlertsBanner';

const DEFAULT_FARM: FarmState = {
  name: '', county: '', lat: '', lon: '', crop: 'general', units: 'metric',
};

export interface CropOption  { value: string; label: string }
export interface UnitOption  { value: string; label: string }
export interface UIConfig {
  crops: CropOption[];
  units: UnitOption[];
  autoRefreshMs: number;
  version: string;
}

export default function Page() {
  const [theme, setTheme]         = useState<'dark' | 'light'>('dark');
  const [farmState, setFarmState] = useState<FarmState>(DEFAULT_FARM);
  const [weatherData, setWeather] = useState<WeatherData | null>(null);
  const [usageData, setUsage]     = useState<UsageData | null>(null);
  const [uiConfig, setUiConfig]   = useState<UIConfig | null>(null);

  // Separate "first-fetch" (no data yet) from "background refresh" (data visible)
  const [isFetching, setFetching]     = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError]             = useState('');
  const [collapsed, setCollapsed]     = useState(false);
  const [alerts, setAlerts]           = useState<WeatherAlert[]>([]);

  // Refs so auto-refresh closure sees current values without stale deps
  const hasDataRef     = useRef(false);
  const farmStateRef   = useRef(farmState);
  farmStateRef.current = farmState;

  // ── Boot ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Theme
    const saved = localStorage.getItem('fc-theme');
    const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    setTheme((saved as 'dark' | 'light') || preferred);

    // Geolocation prefill
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setFarmState(p => ({ ...p, lat: pos.coords.latitude.toFixed(5), lon: pos.coords.longitude.toFixed(5) })),
        () => {},
        { timeout: 5000 },
      );
    }

    // Fetch UI configuration (crops, units, autoRefreshMs)
    fetch('/api/ui/config')
      .then(r => r.json())
      .then(setUiConfig)
      .catch(() => {});
  }, []);

  // ── Theme ──────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('fc-theme', next);
      return next;
    });
  }, []);

  // ── Error ──────────────────────────────────────────────────────────
  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 9000);
  }, []);

  // ── Usage ──────────────────────────────────────────────────────────
  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/ui/usage');
      if (!res.ok) return;
      setUsage(await res.json());
    } catch {}
  }, []);

  // ── Weather fetch (shared by analyze + auto-refresh) ───────────────
  const fetchWeather = useCallback(async (state: FarmState, silent = false) => {
    const isFirst = !hasDataRef.current;

    if (isFirst) setFetching(true);
    else         setRefreshing(true);

    try {
      const url = `/api/ui/weather?lat=${state.lat}&lon=${state.lon}&days=7&units=${state.units}&ai=true`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

      setWeather(data);
      hasDataRef.current = true;
      setLastUpdated(new Date());
      if (isFirst) { setCollapsed(true); loadUsage(); }
    } catch (err: any) {
      if (!silent) showError('Could not load weather data: ' + err.message);
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  }, [loadUsage, showError]);

  // ── Auto-refresh (re-arms whenever weatherData transitions null → truthy) ──
  useEffect(() => {
    if (!weatherData) return;
    const ms = uiConfig?.autoRefreshMs ?? 300_000;
    const id = setInterval(() => {
      const s = farmStateRef.current;
      if (s.lat && s.lon) fetchWeather(s, true);
    }, ms);
    return () => clearInterval(id);
  }, [weatherData, uiConfig, fetchWeather]);

  // ── Alerts polling (every 30 s) ────────────────────────────────────
  useEffect(() => {
    const fetchAlerts = async () => {
      try {
        const res = await fetch('/api/ui/alerts');
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      } catch {}
    };
    fetchAlerts();
    const id = setInterval(fetchAlerts, 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Alert dismiss handlers ─────────────────────────────────────────
  const handleDismissAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    try { await fetch(`/api/ui/alerts?id=${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  const handleDismissAll = useCallback(async () => {
    setAlerts([]);
    try { await fetch('/api/ui/alerts', { method: 'DELETE' }); } catch {}
  }, []);

  // ── Analyze handler ────────────────────────────────────────────────
  const handleAnalyze = useCallback((state: FarmState) => {
    const lat = parseFloat(state.lat);
    const lon = parseFloat(state.lon);
    if (isNaN(lat) || lat < -90  || lat > 90)  { showError('Enter a valid latitude (−90 to 90).'); return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { showError('Enter a valid longitude (−180 to 180).'); return; }
    setFarmState(state);
    fetchWeather(state);
  }, [fetchWeather, showError]);

  // ── Manual refresh ─────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    const s = farmStateRef.current;
    if (s.lat && s.lon) fetchWeather(s);
  }, [fetchWeather]);

  // ── Render ─────────────────────────────────────────────────────────
  return (
    <div
      className={theme}
      style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', transition: 'background .3s, color .3s' }}
    >
      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
        <Header theme={theme} onThemeToggle={toggleTheme} />

        {/* Error banner */}
        {error && (
          <div
            className="mb-4 px-4 py-3 rounded-lg text-sm flex items-center justify-between gap-3"
            style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5' }}
          >
            <span>{error}</span>
            <button onClick={() => setError('')} style={{ background: 'none', border: 'none', color: 'inherit', cursor: 'pointer', fontSize: '1rem' }}>✕</button>
          </div>
        )}

        {/* Active weather alerts */}
        <AlertsBanner
          alerts={alerts}
          onDismiss={handleDismissAlert}
          onDismissAll={handleDismissAll}
        />

        {/* Setup form */}
        <SetupForm
          farmState={farmState}
          onChange={setFarmState}
          onAnalyze={handleAnalyze}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          hasData={!!weatherData}
          crops={uiConfig?.crops}
          units={uiConfig?.units}
          isFetching={isFetching}
        />

        {/* Farm badge + refresh controls */}
        {weatherData && (
          <div className="flex items-center gap-2.5 mb-4 flex-wrap">
            <div
              className="flex items-center gap-2.5 px-4 py-2 rounded-full text-sm"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
            >
              <span>🌾</span>
              <span className="font-bold" style={{ color: 'var(--green)' }}>{farmState.name || '—'}</span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span style={{ color: 'var(--amber)' }}>
                {(farmState.crop || 'general').charAt(0).toUpperCase() + (farmState.crop || 'general').slice(1)}
              </span>
              <span style={{ color: 'var(--border)' }}>·</span>
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                {parseFloat(farmState.lat).toFixed(4)}, {parseFloat(farmState.lon).toFixed(4)}
              </span>
            </div>

            {/* Refresh button */}
            <button
              onClick={handleRefresh}
              disabled={isRefreshing || isFetching}
              title="Refresh weather data"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer disabled:opacity-50"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--green)' }}
            >
              <svg
                width="12" height="12"
                viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: isRefreshing ? 'spin .7s linear infinite' : 'none' }}
              >
                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {isRefreshing ? 'Refreshing…' : 'Refresh'}
            </button>

            {/* Last updated */}
            {lastUpdated && !isRefreshing && (
              <span className="text-xs" style={{ color: 'var(--muted)' }}>
                Updated {lastUpdated.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            )}
          </div>
        )}

        {/* First-fetch loading state (no data yet) */}
        {isFetching && !weatherData && (
          <div className="card flex flex-col items-center justify-center py-20 gap-4 mb-4">
            <div className="spinner" />
            <p className="text-sm" style={{ color: 'var(--muted)' }}>Fetching weather data…</p>
          </div>
        )}

        {/* Empty state */}
        {!weatherData && !isFetching && (
          <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
            <div className="text-6xl mb-3">🌦</div>
            <p className="text-base leading-7">
              Enter your farm details above<br />
              and click <strong>Analyze</strong> to see weather risks.
            </p>
          </div>
        )}

        {/* Dashboard — stays visible during refreshes */}
        {weatherData && (
          <Dashboard
            data={weatherData}
            farmState={farmState}
            usageData={usageData}
            isRefreshing={isRefreshing}
            lastUpdated={lastUpdated}
          />
        )}

        <footer className="text-center mt-8 text-xs" style={{ color: 'var(--muted)' }}>
          Powered by{' '}
          <a href="https://weather-ai.co" target="_blank" rel="noopener" style={{ color: 'var(--green)', textDecoration: 'none' }}>
            WeatherAI API
          </a>{' '}
          · Auto-refreshes every {Math.round((uiConfig?.autoRefreshMs ?? 300_000) / 60_000)} min
        </footer>
      </div>
    </div>
  );
}
