'use client';

import { useState, useEffect, useCallback } from 'react';
import type { WeatherData, FarmState, UsageData } from '@/lib/types';
import Header from '@/components/Header';
import SetupForm from '@/components/SetupForm';
import Dashboard from '@/components/Dashboard';

const DEFAULT_FARM: FarmState = {
  name: '', county: '', lat: '', lon: '', crop: 'general', units: 'metric',
};

export default function Page() {
  const [theme, setTheme]           = useState<'dark' | 'light'>('dark');
  const [farmState, setFarmState]   = useState<FarmState>(DEFAULT_FARM);
  const [weatherData, setWeather]   = useState<WeatherData | null>(null);
  const [usageData, setUsage]       = useState<UsageData | null>(null);
  const [loading, setLoading]       = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');
  const [error, setError]           = useState('');
  const [collapsed, setCollapsed]   = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('fc-theme');
    const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    setTheme((saved as 'dark' | 'light') || preferred);

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setFarmState(p => ({ ...p, lat: pos.coords.latitude.toFixed(5), lon: pos.coords.longitude.toFixed(5) })),
        () => {},
        { timeout: 5000 },
      );
    }
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('fc-theme', next);
      return next;
    });
  }, []);

  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 9000);
  }, []);

  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch('/api/usage');
      if (!res.ok) return;
      setUsage(await res.json());
    } catch {}
  }, []);

  const fetchWeather = useCallback(async (state: FarmState) => {
    setLoadingMsg('Fetching weather data…');
    setLoading(true);
    try {
      const url = `/api/weather?lat=${state.lat}&lon=${state.lon}&days=7&units=${state.units}&ai=true`;
      const res  = await fetch(url);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);
      setWeather(data);
      setCollapsed(true);
      loadUsage();
    } catch (err: any) {
      showError('Could not load weather data: ' + err.message);
    } finally {
      setLoading(false);
    }
  }, [loadUsage, showError]);

  const handleAnalyze = useCallback((state: FarmState) => {
    const lat = parseFloat(state.lat);
    const lon = parseFloat(state.lon);
    if (isNaN(lat) || lat < -90  || lat > 90)  { showError('Enter a valid latitude (-90 to 90).'); return; }
    if (isNaN(lon) || lon < -180 || lon > 180) { showError('Enter a valid longitude (-180 to 180).'); return; }
    setFarmState(state);
    fetchWeather(state);
  }, [fetchWeather, showError]);

  return (
    <div className={theme} style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', transition: 'background .3s, color .3s' }}>

      {/* Loading overlay */}
      {loading && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4" style={{ background: 'var(--bg)' }}>
          <div className="spinner" />
          <p className="text-sm" style={{ color: 'var(--muted)' }}>{loadingMsg || 'Analyzing farm conditions…'}</p>
        </div>
      )}

      <div className="max-w-5xl mx-auto px-4 py-6 pb-16">
        <Header theme={theme} onThemeToggle={toggleTheme} />

        {/* Error banner */}
        {error && (
          <div className="mb-4 px-4 py-3 rounded-lg text-sm" style={{ background: 'rgba(239,68,68,.12)', border: '1px solid rgba(239,68,68,.3)', color: '#fca5a5' }}>
            {error}
          </div>
        )}

        <SetupForm
          farmState={farmState}
          onChange={setFarmState}
          onAnalyze={handleAnalyze}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(c => !c)}
          hasData={!!weatherData}
        />

        {/* Farm badge */}
        {weatherData && (
          <div className="flex items-center gap-2.5 px-4 py-2.5 rounded-full text-sm mb-4" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)', width: 'fit-content' }}>
            <span>🌾</span>
            <span className="font-bold" style={{ color: 'var(--green)' }}>{farmState.name || '—'}</span>
            <span>·</span>
            <span style={{ color: 'var(--amber)' }}>
              {(farmState.crop || 'general').charAt(0).toUpperCase() + (farmState.crop || 'general').slice(1)}
            </span>
            <span>·</span>
            <span className="text-xs" style={{ color: 'var(--muted)' }}>
              {parseFloat(farmState.lat).toFixed(4)}, {parseFloat(farmState.lon).toFixed(4)}
            </span>
          </div>
        )}

        {/* Empty state */}
        {!weatherData && !loading && (
          <div className="text-center py-16" style={{ color: 'var(--muted)' }}>
            <div className="text-6xl mb-3">🌦</div>
            <p className="text-base leading-7">
              Enter your farm details above<br />
              and click <strong>Analyze</strong> to see weather risks.
            </p>
          </div>
        )}

        {/* Dashboard */}
        {weatherData && (
          <Dashboard data={weatherData} farmState={farmState} usageData={usageData} />
        )}

        <footer className="text-center mt-8 text-xs" style={{ color: 'var(--muted)' }}>
          Powered by{' '}
          <a href="https://weather-ai.co" target="_blank" rel="noopener" style={{ color: 'var(--green)', textDecoration: 'none' }}>
            WeatherAI API
          </a>{' '}
          · Data refreshes on each analysis run
        </footer>
      </div>
    </div>
  );
}
