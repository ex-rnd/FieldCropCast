'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useUser } from '@clerk/nextjs';
import type { WeatherData, FarmState, UsageData, WeatherAlert } from '@/lib/types';
import { loadFarmFromFirebase, saveFarmToFirebase } from '@/lib/farm-db';
import AppTopNav    from '@/components/AppTopNav';
import LeftSidebar  from '@/components/LeftSidebar';
import CenterPanel  from '@/components/CenterPanel';
import RightSidebar from '@/components/RightSidebar';

const DEFAULT_FARM: FarmState = {
  name: '', county: '', lat: '', lon: '', crop: 'general', units: 'metric',
};

export interface CropOption { value: string; label: string }
export interface UnitOption { value: string; label: string }
export interface UIConfig {
  crops: CropOption[];
  units: UnitOption[];
  autoRefreshMs: number;
  version: string;
}

export default function Page() {
  const { user } = useUser();
  const userEmail = user?.primaryEmailAddress?.emailAddress ?? null;

  const [theme, setTheme]           = useState<'dark' | 'light'>('dark');
  const [farmState, setFarmState]   = useState<FarmState>(DEFAULT_FARM);
  const [weatherData, setWeather]   = useState<WeatherData | null>(null);
  const [usageData, setUsage]       = useState<UsageData | null>(null);
  const [uiConfig, setUiConfig]     = useState<UIConfig | null>(null);
  const [isFetching, setFetching]   = useState(false);
  const [isRefreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [error, setError]           = useState('');
  const [alerts, setAlerts]         = useState<WeatherAlert[]>([]);

  const hasDataRef     = useRef(false);
  const farmStateRef   = useRef(farmState);
  farmStateRef.current = farmState;

  // ── Boot ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const saved     = localStorage.getItem('fc-theme');
    const preferred = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    setTheme((saved as 'dark' | 'light') || preferred);

    const savedFarm = localStorage.getItem('fc-farm');
    if (savedFarm) {
      try { setFarmState(f => ({ ...DEFAULT_FARM, ...f, ...JSON.parse(savedFarm) })); } catch {}
    }

    if (userEmail) {
      loadFarmFromFirebase(userEmail).then(remote => {
        if (remote) {
          const merged = { ...DEFAULT_FARM, ...remote };
          setFarmState(merged);
          localStorage.setItem('fc-farm', JSON.stringify(merged));
        }
      });
    }

    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => setFarmState(p => ({
          ...p,
          lat: pos.coords.latitude.toFixed(5),
          lon: pos.coords.longitude.toFixed(5),
        })),
        () => {},
        { timeout: 5000 },
      );
    }

    fetch('/backend/api/config').then(r => r.json()).then(setUiConfig).catch(() => {});
  }, [userEmail]); // re-run when Clerk resolves the user

  // ── Theme ─────────────────────────────────────────────────────────────
  const toggleTheme = useCallback(() => {
    setTheme(t => {
      const next = t === 'dark' ? 'light' : 'dark';
      localStorage.setItem('fc-theme', next);
      return next;
    });
  }, []);

  // ── Error toast (auto-dismiss) ─────────────────────────────────────────
  const showError = useCallback((msg: string) => {
    setError(msg);
    setTimeout(() => setError(''), 9000);
  }, []);

  // ── Usage ─────────────────────────────────────────────────────────────
  const loadUsage = useCallback(async () => {
    try {
      const res = await fetch('/backend/api/usage');
      if (!res.ok) return;
      setUsage(await res.json());
    } catch {}
  }, []);

  // ── Weather fetch ─────────────────────────────────────────────────────
  const fetchWeather = useCallback(async (state: FarmState, silent = false) => {
    const isFirst = !hasDataRef.current;
    if (isFirst) setFetching(true);
    else         setRefreshing(true);

    try {
      const url  = `/backend/api/weather?lat=${state.lat}&lon=${state.lon}&days=7&units=${state.units}&ai=true&lang=sw`;
      const res  = await fetch(url);
      const data = await res.json();

      if (!res.ok) {
        if (!silent) {
          const code = data?.code as string | undefined;
          if (code === 'QUOTA_EXCEEDED') {
            const reset = data.resetAt ? ' Resets ' + new Date(data.resetAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) + '.' : '';
            showError('AI quota exhausted for this period.' + reset);
          } else if (code === 'AUTH_ERROR') {
            showError('Service authentication failed. Contact support.');
          } else if (code === 'TIMEOUT') {
            showError('Request timed out. Check your connection and try again.');
          } else {
            showError('Weather service is temporarily unavailable. Please try again shortly.');
          }
        }
        return;
      }

      setWeather(data);
      hasDataRef.current = true;
      setLastUpdated(new Date());
      if (isFirst) loadUsage();
    } catch (err: unknown) {
      if (!silent) showError('Could not load weather data. Check your connection.');
    } finally {
      setFetching(false);
      setRefreshing(false);
    }
  }, [loadUsage, showError]);

  // ── Auto-refresh every 3 min ──────────────────────────────────────────
  useEffect(() => {
    if (!weatherData) return;
    const ms = uiConfig?.autoRefreshMs ?? 1_800_000;
    const id = setInterval(() => {
      const s = farmStateRef.current;
      if (s.lat && s.lon) fetchWeather(s, true);
    }, ms);
    return () => clearInterval(id);
  }, [weatherData, uiConfig, fetchWeather]);

  // ── Alerts polling (30 s) ─────────────────────────────────────────────
  useEffect(() => {
    const poll = async () => {
      try {
        const res = await fetch('/backend/api/alerts');
        if (!res.ok) return;
        const data = await res.json();
        setAlerts(data.alerts ?? []);
      } catch {}
    };
    poll();
    const id = setInterval(poll, 30_000);
    return () => clearInterval(id);
  }, []);

  // ── Alert dismiss ─────────────────────────────────────────────────────
  const handleDismissAlert = useCallback(async (id: string) => {
    setAlerts(prev => prev.filter(a => a.id !== id));
    try { await fetch(`/backend/api/alerts?id=${id}`, { method: 'DELETE' }); } catch {}
  }, []);

  const handleDismissAll = useCallback(async () => {
    setAlerts([]);
    try { await fetch('/backend/api/alerts', { method: 'DELETE' }); } catch {}
  }, []);

  // ── Analyze ───────────────────────────────────────────────────────────
  const handleAnalyze = useCallback((state: FarmState) => {
    const lat = parseFloat(state.lat);
    const lon = parseFloat(state.lon);
    if (isNaN(lat) || lat < -90  || lat > 90)   { showError('Enter a valid latitude (−90 to 90).');   return; }
    if (isNaN(lon) || lon < -180 || lon > 180)  { showError('Enter a valid longitude (−180 to 180).'); return; }
    setFarmState(state);
    localStorage.setItem('fc-farm', JSON.stringify(state));
    if (userEmail) saveFarmToFirebase(userEmail, state).catch(() => {});
    fetchWeather(state);
  }, [fetchWeather, showError, userEmail]);

  // ── Manual refresh ────────────────────────────────────────────────────
  const handleRefresh = useCallback(() => {
    const s = farmStateRef.current;
    if (s.lat && s.lon) fetchWeather(s);
  }, [fetchWeather]);

  const handleResetCache = useCallback(() => {
    localStorage.removeItem('fc-farm');
    localStorage.removeItem('fc-theme');
    window.location.reload();
  }, []);

  // ── Crop change (no re-fetch — recommendations re-compute locally) ────
  const handleCropChange = useCallback((crop: string) => {
    setFarmState(s => {
      const next = { ...s, crop, cropVariety: undefined };
      localStorage.setItem('fc-farm', JSON.stringify(next));
      if (userEmail) saveFarmToFirebase(userEmail, next).catch(() => {});
      return next;
    });
  }, [userEmail]);

  // ── Crop details change ───────────────────────────────────────────────
  const handleFarmStateChange = useCallback((updates: Partial<FarmState>) => {
    setFarmState(s => {
      const next = { ...s, ...updates };
      localStorage.setItem('fc-farm', JSON.stringify(next));
      if (userEmail) saveFarmToFirebase(userEmail, next).catch(() => {});
      return next;
    });
  }, [userEmail]);

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <div className={`${theme} fc-app`}>

      {/* ── Top Navigation ─────────────────────────────────────────── */}
      <AppTopNav
        theme={theme}
        onThemeToggle={toggleTheme}
        farmState={farmState}
        weatherData={weatherData}
        isRefreshing={isRefreshing}
        isFetching={isFetching}
        onRefresh={handleRefresh}
        onResetCache={handleResetCache}
      />

      {/* ── 3-Column Body ──────────────────────────────────────────── */}
      <div className="fc-body">

        {/* Left: Farmer identity + current weather */}
        <LeftSidebar
          farmState={farmState}
          onChange={setFarmState}
          onAnalyze={handleAnalyze}
          weatherData={weatherData}
          isFetching={isFetching}
          isRefreshing={isRefreshing}
          lastUpdated={lastUpdated}
          autoRefreshMs={uiConfig?.autoRefreshMs ?? 1_800_000}
          crops={uiConfig?.crops}
          units={uiConfig?.units}
          usageData={usageData}
        />

        {/* Center: Crop selector + Recommendations + Conditions */}
        <CenterPanel
          farmState={farmState}
          weatherData={weatherData}
          onCropChange={handleCropChange}
          onFarmStateChange={handleFarmStateChange}
          isFetching={isFetching}
        />

        {/* Right: AI summary + Photos + Forecasts + Alerts */}
        <RightSidebar
          weatherData={weatherData}
          farmState={farmState}
          alerts={alerts}
          onDismiss={handleDismissAlert}
          onDismissAll={handleDismissAll}
          isFetching={isFetching}
        />
      </div>

      {/* ── Error Toast ────────────────────────────────────────────── */}
      {error && (
        <div
          className="fixed bottom-6 left-1/2 fade-in"
          style={{ transform: 'translateX(-50%)', zIndex: 100, maxWidth: 420, width: '90vw' }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm shadow-xl"
            style={{
              background: 'rgba(239,68,68,.95)',
              border: '1px solid rgba(239,68,68,.5)',
              color: '#fff',
              backdropFilter: 'blur(12px)',
            }}
          >
            <span className="text-base shrink-0">⚠️</span>
            <span className="flex-1 leading-relaxed">{error}</span>
            <button
              onClick={() => setError('')}
              className="shrink-0 cursor-pointer hover:opacity-70 transition-opacity"
              style={{ background: 'none', border: 'none', color: 'inherit', fontSize: '1rem' }}
            >✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
