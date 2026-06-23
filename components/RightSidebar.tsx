'use client';

import { useRef, useState, useEffect, useCallback } from 'react';
import type { WeatherData, FarmState, DailyForecast, HourlyForecast, WeatherAlert, AlertSeverity } from '@/lib/types';
import { wmoIcon, fmtTemp, fmtPrecip, isDaytime, dayName, localHour, generateSummary, generateSummaryEn } from '@/lib/weather-utils';

interface Props {
  weatherData: WeatherData | null;
  farmState: FarmState;
  alerts: WeatherAlert[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  isFetching?: boolean;
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

export default function RightSidebar({ weatherData, farmState, alerts, onDismiss, onDismissAll, isFetching = false }: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [summaryLang, setSummaryLang]     = useState<'sw' | 'en'>('sw');
  const [enSummary, setEnSummary]         = useState('');
  const [isFetchingLang, setFetchingLang] = useState(false);

  const [treeQuota, setTreeQuota]         = useState<any>(null);
  const [treeHistory, setTreeHistory]     = useState<any[]>([]);
  const [historyOpen, setHistoryOpen]     = useState(false);
  const [treeResult, setTreeResult]       = useState<any>(null);
  const [isAnalyzing, setIsAnalyzing]     = useState(false);
  const [analyzeError, setAnalyzeError]   = useState('');

  // Clear cached EN summary whenever weather data refreshes
  useEffect(() => { setEnSummary(''); }, [weatherData]);

  useEffect(() => {
    fetch('/backend/api/trees/quota').then(r => r.ok ? r.json() : null).then(d => { if (d) setTreeQuota(d); }).catch(() => {});
    fetch('/backend/api/trees/history').then(r => r.ok ? r.json() : null).then(d => {
      if (d) setTreeHistory(Array.isArray(d) ? d : (d.analyses ?? d.history ?? d.data ?? []));
    }).catch(() => {});
  }, []);

  const fetchEnSummary = useCallback(async () => {
    if (!weatherData || !farmState.lat || !farmState.lon) {
      setEnSummary(generateSummaryEn(weatherData, farmState));
      return;
    }
    setFetchingLang(true);
    try {
      const url = `/backend/api/weather?lat=${farmState.lat}&lon=${farmState.lon}&days=7&units=${farmState.units}&ai=true&lang=en`;
      const res  = await fetch(url);
      const data = await res.json();
      setEnSummary(data.ai_summary || data.summary || generateSummaryEn(weatherData, farmState));
    } catch {
      setEnSummary(generateSummaryEn(weatherData, farmState));
    } finally {
      setFetchingLang(false);
    }
  }, [weatherData, farmState]);

  const farmSizeToAcres = (size?: string): number | undefined => {
    if (!size) return undefined;
    const map: Record<string, number> = {
      '< 1 acre': 0.5, '1–2 acres': 1.5, '2–5 acres': 3.5,
      '5–10 acres': 7.5, '> 10 acres': 15,
    };
    return map[size];
  };

  const handleImageUpload = useCallback(async (file: File) => {
    setIsAnalyzing(true);
    setAnalyzeError('');
    setTreeResult(null);
    try {
      const fd = new FormData();
      fd.append('image', file);
      if (farmState.name)   fd.append('farmerId', farmState.name);
      if (farmState.county) fd.append('county',   farmState.county);
      const acres = farmSizeToAcres(farmState.farmSize);
      if (acres != null)    fd.append('landAcres', String(acres));
      const noteParts = [farmState.cropVariety, farmState.crop].filter(Boolean);
      if (noteParts.length) fd.append('notes', noteParts.join(' ') + ' plantation');
      if (farmState.name && farmState.county) fd.append('location', `${farmState.name}, ${farmState.county}`);

      const res  = await fetch('/backend/api/trees/analyze', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setTreeResult(data);
      // refresh quota + prepend to history
      fetch('/backend/api/trees/quota').then(r => r.ok ? r.json() : null).then(d => { if (d) setTreeQuota(d); }).catch(() => {});
      setTreeHistory(prev => [data, ...prev]);
    } catch (err: any) {
      setAnalyzeError(err.message || 'Analysis failed. Please try again.');
    } finally {
      setIsAnalyzing(false);
    }
  }, [farmState]);

  const handleLangToggle = useCallback((lang: 'sw' | 'en') => {
    setSummaryLang(lang);
    if (lang === 'en' && !enSummary) fetchEnSummary();
  }, [enSummary, fetchEnSummary]);

  const swSummary = weatherData?.ai_summary || weatherData?.summary || (weatherData ? generateSummary(weatherData, farmState) : '');
  const activeSummary = summaryLang === 'en'
    ? (enSummary || (isFetchingLang ? '' : generateSummaryEn(weatherData, farmState)))
    : swSummary;

  const daily   = (weatherData?.daily  ?? []) as DailyForecast[];
  const hourly  = (weatherData?.hourly ?? []) as HourlyForecast[];
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
        <div className="flex items-center gap-2 mb-3">
          <span style={{ fontSize: 13 }}>✨</span>
          <span className="text-[11px] font-bold uppercase tracking-widest flex-1" style={{ color: 'var(--muted)' }}>
            AI-Generated Summary
          </span>
          {/* Language toggle */}
          <div className="flex items-center gap-1">
            {(['sw', 'en'] as const).map(lang => (
              <button
                key={lang}
                onClick={() => handleLangToggle(lang)}
                disabled={isFetchingLang && lang === 'en'}
                className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wide cursor-pointer transition-all disabled:opacity-50"
                style={{
                  background: summaryLang === lang ? 'rgba(74,222,128,.18)' : 'transparent',
                  border: summaryLang === lang ? '1px solid rgba(74,222,128,.4)' : '1px solid var(--border)',
                  color: summaryLang === lang ? 'var(--green)' : 'var(--muted)',
                }}
              >
                {isFetchingLang && lang === 'en' ? (
                  <svg width="8" height="8" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"
                    style={{ display: 'inline', animation: 'spin .7s linear infinite' }}>
                    <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                    <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
                  </svg>
                ) : lang.toUpperCase()}
              </button>
            ))}
          </div>
        </div>

        {activeSummary ? (
          <div
            key={summaryLang}
            className="p-3 rounded-xl text-sm leading-7 fade-in"
            style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.18)', color: 'var(--text2)' }}
          >
            {activeSummary}
          </div>
        ) : isFetching ? (
          <div
            className="animate-pulse p-3 rounded-xl"
            style={{ background: 'rgba(74,222,128,.06)', border: '1px solid rgba(74,222,128,.18)' }}
          >
            {[90, 75, 82, 60].map((w, i) => (
              <div key={i} className="h-2.5 rounded-full mb-2.5 last:mb-0"
                style={{ background: 'var(--border)', width: w + '%' }} />
            ))}
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
          onClick={() => !isAnalyzing && fileInputRef.current?.click()}
          role="button"
          tabIndex={0}
          onKeyDown={e => e.key === 'Enter' && !isAnalyzing && fileInputRef.current?.click()}
          style={{ opacity: isAnalyzing ? 0.7 : 1, cursor: isAnalyzing ? 'default' : 'pointer' }}
        >
          {isAnalyzing ? (
            <>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--green)" strokeWidth="2"
                style={{ display: 'block', margin: '0 auto 8px', animation: 'spin .9s linear infinite' }}>
                <path d="M23 4v6h-6"/><path d="M1 20v-6h6"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
              <p className="text-xs font-semibold" style={{ color: 'var(--green)' }}>Analysing image…</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>This may take a few seconds</p>
            </>
          ) : (
            <>
              <div style={{ fontSize: 28, marginBottom: 8 }}>📷</div>
              <p className="text-xs font-semibold" style={{ color: 'var(--text2)' }}>Upload Field Photo</p>
              <p className="text-[10px] mt-1" style={{ color: 'var(--muted)' }}>
                JPG · PNG · WEBP · up to 20 MB
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
            </>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={e => {
              const file = e.target.files?.[0];
              if (file) { handleImageUpload(file); e.target.value = ''; }
            }}
          />
        </div>
      </div>

      {/* ── Tree Analysis Result ─────────────────────────────────── */}
      {analyzeError && (
        <div className="rs-section">
          <div className="px-3 py-2.5 rounded-xl text-[10px]"
            style={{ background: 'rgba(239,68,68,.1)', border: '1px solid rgba(239,68,68,.3)', color: '#ef4444' }}>
            ⚠️ {analyzeError}
          </div>
        </div>
      )}

      {treeResult && (
        <div className="rs-section fade-in">
          <div className="flex items-center gap-2 mb-3">
            <span style={{ fontSize: 13 }}>🔬</span>
            <span className="text-[11px] font-bold uppercase tracking-widest flex-1" style={{ color: 'var(--muted)' }}>
              Analysis Result
            </span>
            <button
              onClick={() => setTreeResult(null)}
              className="text-[9px] px-2 py-0.5 rounded cursor-pointer"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
            >
              ✕ clear
            </button>
          </div>

          {/* Overlay image */}
          {(treeResult.overlay_image_url || treeResult.original_image_url) && (
            <a href={treeResult.overlay_image_url || treeResult.original_image_url} target="_blank" rel="noopener noreferrer">
              <img
                src={treeResult.overlay_image_url || treeResult.original_image_url}
                alt="Annotated field photo"
                className="w-full rounded-xl mb-3 object-cover"
                style={{ maxHeight: 180, border: '1px solid var(--border)' }}
              />
            </a>
          )}

          {/* Key stats row */}
          <div className="flex gap-2 mb-3">
            {[
              { lbl: 'Trees', val: treeResult.total_tree_count ?? '—' },
              { lbl: 'Density/acre', val: treeResult.tree_density_per_acre != null ? treeResult.tree_density_per_acre.toFixed(1) : '—' },
              { lbl: 'Canopy', val: treeResult.canopy_coverage_pct != null ? treeResult.canopy_coverage_pct + '%' : '—' },
              { lbl: 'Confidence', val: treeResult.confidence_score != null ? Math.round(treeResult.confidence_score * 100) + '%' : '—' },
            ].map(s => (
              <div key={s.lbl} className="flex flex-1 flex-col items-center justify-center gap-0.5 py-2 rounded-xl text-center"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                <span className="text-[11px] font-bold" style={{ color: 'var(--text)' }}>{s.val}</span>
                <span className="text-[8px] uppercase tracking-wider" style={{ color: 'var(--muted)' }}>{s.lbl}</span>
              </div>
            ))}
          </div>

          {/* Health breakdown */}
          {treeResult.tree_health && (
            <div className="mb-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--muted)' }}>Tree Health</div>
              <div className="flex gap-3 text-[10px]">
                {treeResult.tree_health.healthy != null && (
                  <span style={{ color: 'var(--green)' }}>✅ {treeResult.tree_health.healthy} healthy</span>
                )}
                {treeResult.tree_health.needs_care != null && treeResult.tree_health.needs_care > 0 && (
                  <span style={{ color: 'var(--amber)' }}>⚠️ {treeResult.tree_health.needs_care} need care</span>
                )}
                {treeResult.tree_health.needs_replacement != null && treeResult.tree_health.needs_replacement > 0 && (
                  <span style={{ color: 'var(--risk-crit)' }}>🔴 {treeResult.tree_health.needs_replacement} replace</span>
                )}
              </div>
              {/* Mini bar */}
              {(() => {
                const h = treeResult.tree_health.healthy ?? 0;
                const c = treeResult.tree_health.needs_care ?? 0;
                const r = treeResult.tree_health.needs_replacement ?? 0;
                const total = h + c + r || 1;
                return (
                  <div className="flex rounded-full overflow-hidden mt-2" style={{ height: 5 }}>
                    <div style={{ width: (h / total * 100) + '%', background: 'var(--green)' }} />
                    <div style={{ width: (c / total * 100) + '%', background: 'var(--amber)' }} />
                    <div style={{ width: (r / total * 100) + '%', background: 'var(--risk-crit)' }} />
                  </div>
                );
              })()}
            </div>
          )}

          {/* Species guess */}
          {treeResult.tree_species_guess && (
            <div className="mb-3 px-3 py-2 rounded-xl text-[10px]"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <span style={{ color: 'var(--muted)' }}>🌿 Species: </span>
              <span className="font-semibold" style={{ color: 'var(--text)' }}>{treeResult.tree_species_guess}</span>
            </div>
          )}

          {/* AI Observations */}
          {treeResult.observations?.length > 0 && (
            <div className="mb-3">
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>Observations</div>
              <div className="flex flex-col gap-1.5">
                {treeResult.observations.map((obs: string, i: number) => (
                  <div key={i} className="flex gap-2 px-3 py-2 rounded-xl text-[10px]"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                    <span>🔍</span>
                    <span style={{ color: 'var(--text2)' }}>{obs}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Recommendations */}
          {treeResult.recommendations?.length > 0 && (
            <div>
              <div className="text-[9px] font-semibold uppercase tracking-wider mb-1.5" style={{ color: 'var(--muted)' }}>Recommendations</div>
              <div className="flex flex-col gap-1.5">
                {treeResult.recommendations.map((rec: string, i: number) => (
                  <div key={i} className="flex gap-2 px-3 py-2 rounded-xl text-[10px]"
                    style={{ background: 'rgba(74,222,128,.08)', border: '1px solid rgba(74,222,128,.2)' }}>
                    <span>💡</span>
                    <span style={{ color: 'var(--text2)' }}>{rec}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ── Tree Analysis ────────────────────────────────────────── */}
      <div className="rs-section">
        <SectionTitle icon="🌳">Tree Analysis</SectionTitle>

        {/* Quota bar */}
        {treeQuota && (() => {
          const used      = treeQuota.used ?? treeQuota.analyses_used ?? 0;
          const limit     = treeQuota.limit ?? treeQuota.analyses_limit ?? 5;
          const remaining = treeQuota.remaining ?? (limit - used);
          const pct       = limit > 0 ? Math.round((remaining / limit) * 100) : 0;
          const barColor  = pct > 50 ? 'var(--green)' : pct > 20 ? 'var(--amber)' : 'var(--risk-crit)';
          const resetDate = treeQuota.reset_at ?? treeQuota.period_end ?? treeQuota.resets_at;
          return (
            <div className="mb-3 px-3 py-2.5 rounded-xl" style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  Analyses this month
                </span>
                <span className="text-[10px] font-mono font-bold" style={{ color: barColor }}>
                  {remaining} / {limit} remaining
                </span>
              </div>
              <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: pct + '%', background: barColor }} />
              </div>
              {resetDate && (
                <div className="text-[9px] mt-1.5" style={{ color: 'var(--muted)' }}>
                  Resets {new Date(resetDate).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })}
                </div>
              )}
            </div>
          );
        })()}

        {/* History */}
        {treeHistory.length > 0 && (
          <div>
            <button
              onClick={() => setHistoryOpen(o => !o)}
              className="flex items-center justify-between w-full mb-2 cursor-pointer"
              style={{ background: 'none', border: 'none', padding: 0 }}
            >
              <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                Previous Analyses ({treeHistory.length})
              </span>
              <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{historyOpen ? '▲' : '▼'}</span>
            </button>

            {historyOpen && (
              <div className="flex flex-col gap-2 fade-in">
                {treeHistory.slice(0, 10).map((a: any, i: number) => {
                  const date      = a.timestamp ?? a.created_at ?? a.date;
                  const count     = a.total_tree_count ?? a.tree_count ?? '—';
                  const coverage  = a.canopy_coverage_pct ?? a.canopy_pct;
                  const location  = a.location ?? a.county ?? a.farmer_id ?? `Analysis ${i + 1}`;
                  const healthy   = a.tree_health?.healthy;
                  const needsCare = a.tree_health?.needs_care;
                  return (
                    <div
                      key={a.analysis_id ?? i}
                      className="px-3 py-2.5 rounded-xl text-xs"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                    >
                      <div className="flex items-start justify-between gap-2 mb-1.5">
                        <span className="font-semibold leading-tight" style={{ color: 'var(--text)' }}>{location}</span>
                        {date && (
                          <span className="shrink-0 text-[9px]" style={{ color: 'var(--muted)' }}>
                            {new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 flex-wrap">
                        <span style={{ color: 'var(--text2)' }}>🌳 {count} trees</span>
                        {coverage != null && (
                          <span style={{ color: 'var(--text2)' }}>🌿 {coverage}% canopy</span>
                        )}
                        {healthy != null && (
                          <span style={{ color: 'var(--green)' }}>✅ {healthy} healthy</span>
                        )}
                        {needsCare != null && needsCare > 0 && (
                          <span style={{ color: 'var(--amber)' }}>⚠️ {needsCare} need care</span>
                        )}
                      </div>
                      {a.overlay_image_url && (
                        <a
                          href={a.overlay_image_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 mt-2 text-[9px] font-semibold"
                          style={{ color: 'var(--sky)', textDecoration: 'none' }}
                        >
                          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                            <polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/>
                          </svg>
                          View annotated image
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {!treeQuota && treeHistory.length === 0 && (
          <p className="text-[10px] text-center py-2" style={{ color: 'var(--muted)' }}>
            Upload a field photo above to run your first tree analysis.
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
                    {isToday ? 'Today' : dayName(day.date)}
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
        ) : isFetching ? (
          <div className="animate-pulse flex flex-col">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="forecast-row">
                <div className="h-2.5 rounded-full w-9 shrink-0" style={{ background: 'var(--border)' }} />
                <div className="h-5 w-5 rounded-full shrink-0" style={{ background: 'var(--border)' }} />
                <div className="flex-1" />
                <div className="h-2.5 rounded-full w-8 shrink-0" style={{ background: 'var(--border)' }} />
                <div className="h-2.5 rounded-full w-6 shrink-0" style={{ background: 'var(--border)' }} />
                <div className="h-2.5 rounded-full w-7 shrink-0" style={{ background: 'var(--border)' }} />
              </div>
            ))}
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
