'use client';

import type { WeatherAlert, UsageData, FarmState, AlertSeverity } from '@/lib/types';

interface Props {
  alerts: WeatherAlert[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
  usageData: UsageData | null;
  farmState: FarmState;
  hasData: boolean;
}

// ── Tactics learned from AuditLog.tsx / ToolCard.tsx ──────────────────────
const SEVERITY_STYLES: Record<AlertSeverity, { border: string; bg: string; color: string }> = {
  info:     { border: 'var(--green)',     bg: 'rgba(74,222,128,.07)',  color: 'var(--green)'     },
  warning:  { border: 'var(--amber)',     bg: 'rgba(251,191,36,.07)',  color: 'var(--amber)'     },
  high:     { border: 'var(--risk-high)', bg: 'rgba(249,115,22,.07)',  color: 'var(--risk-high)' },
  critical: { border: 'var(--risk-crit)', bg: 'rgba(239,68,68,.07)',   color: 'var(--risk-crit)' },
};

const TYPE_ICONS: Record<string, string> = {
  heavy_rain: '🌧', storm: '⛈', extreme_heat: '🔥', frost: '❄️', high_wind: '💨', unknown: '⚠️',
};

const TYPE_LABELS: Record<string, string> = {
  heavy_rain: 'Heavy Rain', storm: 'Storm Alert', extreme_heat: 'Extreme Heat',
  frost: 'Frost Warning', high_wind: 'High Wind', unknown: 'Alert',
};

function relativeTime(iso: string): string {
  const m = Math.floor((Date.now() - new Date(iso).getTime()) / 60_000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ago` : `${Math.floor(h / 24)}d ago`;
}

function AlertRow({ a, onDismiss }: { a: WeatherAlert; onDismiss: (id: string) => void }) {
  const s = SEVERITY_STYLES[a.severity];
  return (
    <div
      className="flex items-start gap-2.5 px-3 py-2 rounded-lg text-xs"
      style={{ background: s.bg, border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.border}` }}
    >
      <span className="text-sm shrink-0 mt-px">{TYPE_ICONS[a.type] ?? '⚠️'}</span>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-0.5">
          <span className="font-bold" style={{ color: s.color }}>
            {TYPE_LABELS[a.type] ?? 'Alert'}
          </span>
          <span style={{ color: 'var(--muted)', fontSize: 10 }}>{relativeTime(a.receivedAt)}</span>
        </div>
        <p className="leading-relaxed" style={{ color: 'var(--text2)' }}>{a.message}</p>
      </div>
      <button
        onClick={() => onDismiss(a.id)}
        title="Dismiss"
        className="shrink-0 cursor-pointer transition-opacity hover:opacity-60"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: 12, padding: 2, marginTop: -1 }}
      >✕</button>
    </div>
  );
}

export default function RightPanel({ alerts, onDismiss, onDismissAll, usageData, farmState, hasData }: Props) {
  const plan    = usageData?.plan || 'free';
  const period  = usageData?.period  ?? {};
  const limits  = usageData?.limits  ?? {};
  const rem     = usageData?.remaining ?? {};
  const used    = period.requestCount   ?? 0;
  const limit   = limits.requests       ?? 1000;
  const left    = rem.requests    != null ? rem.requests    : limit - used;
  const aiUsed  = period.aiRequestCount ?? 0;
  const aiLimit = limits.aiRequests     ?? 200;
  const aiLeft  = rem.aiRequests  != null ? rem.aiRequests  : aiLimit - aiUsed;
  const reqPct  = limit    ? Math.round((used   / limit)    * 100) : 0;
  const aiPct   = aiLimit  ? Math.round((aiUsed / aiLimit)  * 100) : 0;
  const barColor = (pct: number) => pct >= 90 ? 'var(--risk-crit)' : pct >= 70 ? 'var(--amber)' : 'var(--green)';

  return (
    <div
      className="flex flex-col gap-4 p-3 min-h-full"
      style={{ background: 'var(--bg2)', borderLeft: '1px solid var(--border)' }}
    >

      {/* ── Weather Alerts ── */}
      <section>
        <div className="panel-section-title">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
          Weather Alerts
          {alerts.length > 0 && (
            <span
              className="ml-auto font-black px-1.5 py-0.5 rounded-full"
              style={{
                fontSize: 9,
                background: 'rgba(239,68,68,.15)',
                color: 'var(--risk-crit)',
                border: '1px solid rgba(239,68,68,.3)',
              }}
            >
              {alerts.length}
            </span>
          )}
        </div>

        {alerts.length > 0 ? (
          <div className="flex flex-col gap-1.5">
            <div className="flex justify-end mb-1">
              <button
                onClick={onDismissAll}
                className="text-[10px] cursor-pointer transition-opacity hover:opacity-70"
                style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline' }}
              >
                Dismiss all
              </button>
            </div>
            {alerts.slice(0, 5).map(a => (
              <AlertRow key={a.id} a={a} onDismiss={onDismiss} />
            ))}
            {alerts.length > 5 && (
              <p className="text-center text-[10px]" style={{ color: 'var(--muted)' }}>
                +{alerts.length - 5} more alerts
              </p>
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-1.5 py-5 text-center">
            <span className="text-2xl">✅</span>
            <p className="text-xs" style={{ color: 'var(--muted)' }}>No active alerts</p>
            <p className="leading-relaxed" style={{ color: 'var(--muted)', fontSize: 10 }}>
              Configure webhook in Farm Setup to receive real-time alerts.
            </p>
          </div>
        )}
      </section>

      {/* ── API Quota ── */}
      {usageData && (
        <section>
          <div className="panel-section-title">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="1" />
              <path d="M3 9h18M9 3v18" />
            </svg>
            API Quota
            <span
              className="ml-auto font-bold px-1.5 py-0.5 rounded-full uppercase"
              style={{
                fontSize: 9,
                background: 'rgba(74,222,128,.10)',
                color: 'var(--green)',
                border: '1px solid rgba(74,222,128,.25)',
              }}
            >
              {plan}
            </span>
          </div>

          <div className="flex flex-col gap-3">
            {[
              { lbl: 'Requests', used, limit, pct: reqPct, left },
              { lbl: 'AI Requests', used: aiUsed, limit: aiLimit, pct: aiPct, left: aiLeft },
            ].map(s => (
              <div key={s.lbl}>
                <div className="flex items-center justify-between mb-1">
                  <span className="uppercase tracking-wide" style={{ color: 'var(--muted)', fontSize: 9, fontWeight: 700 }}>{s.lbl}</span>
                  <span className="font-mono" style={{ color: 'var(--text2)', fontSize: 10 }}>
                    {s.used.toLocaleString()} / {s.limit.toLocaleString()}
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--border)' }}>
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{ width: Math.min(100, s.pct) + '%', background: barColor(s.pct) }}
                  />
                </div>
                <div className="mt-0.5" style={{ color: 'var(--muted)', fontSize: 10 }}>
                  {s.left.toLocaleString()} remaining
                </div>
              </div>
            ))}
          </div>

          {period.end && (
            <p className="mt-2" style={{ color: 'var(--muted)', fontSize: 10 }}>
              Resets {new Date(period.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </p>
          )}
        </section>
      )}

      {/* ── Farm Details ── */}
      {hasData && (
        <section>
          <div className="panel-section-title">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            Farm Details
          </div>
          <div className="flex flex-col gap-2 text-xs">
            {[
              { icon: '🌾', lbl: 'Crop',     val: farmState.crop ? farmState.crop.charAt(0).toUpperCase() + farmState.crop.slice(1) : '—' },
              { icon: '📏', lbl: 'Units',    val: farmState.units === 'metric' ? 'Metric (°C)' : 'Imperial (°F)' },
              { icon: '📍', lbl: 'Lat',      val: parseFloat(farmState.lat || '0').toFixed(4) + '°' },
              { icon: '📍', lbl: 'Lon',      val: parseFloat(farmState.lon || '0').toFixed(4) + '°' },
            ].map(item => (
              <div key={item.lbl} className="flex items-center gap-2">
                <span>{item.icon}</span>
                <span style={{ color: 'var(--muted)' }}>{item.lbl}</span>
                <span className="ml-auto font-semibold font-mono" style={{ color: 'var(--text2)', fontSize: 10 }}>
                  {item.val}
                </span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Connection Status ── */}
      <section className="mt-auto">
        <div className="panel-section-title">
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="2" />
            <path d="M16.24 7.76a6 6 0 0 1 0 8.49M7.76 7.76a6 6 0 0 0 0 8.49" />
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
          </svg>
          Connection
        </div>
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full shrink-0 pulse-dot" style={{ background: 'var(--green)' }} />
            <span style={{ color: 'var(--text2)' }}>WeatherAI API</span>
            <span className="ml-auto" style={{ color: 'var(--green)', fontSize: 10 }}>Connected</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ background: alerts.length > 0 ? 'var(--green)' : 'var(--muted)' }}
            />
            <span style={{ color: 'var(--text2)' }}>Webhook</span>
            <span className="ml-auto" style={{ color: alerts.length > 0 ? 'var(--green)' : 'var(--muted)', fontSize: 10 }}>
              {alerts.length > 0 ? 'Active' : 'Idle'}
            </span>
          </div>
        </div>
      </section>

    </div>
  );
}
