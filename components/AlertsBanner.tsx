'use client';

import { useState } from 'react';
import type { WeatherAlert, AlertSeverity } from '@/lib/types';

interface Props {
  alerts: WeatherAlert[];
  onDismiss: (id: string) => void;
  onDismissAll: () => void;
}

const SEVERITY_STYLES: Record<AlertSeverity, { border: string; bg: string; color: string; iconBg: string }> = {
  info:     { border: 'var(--green)',     bg: 'rgba(74,222,128,.08)',  color: 'var(--green)',     iconBg: 'rgba(74,222,128,.15)' },
  warning:  { border: 'var(--amber)',     bg: 'rgba(251,191,36,.08)',  color: 'var(--amber)',     iconBg: 'rgba(251,191,36,.15)' },
  high:     { border: 'var(--risk-high)', bg: 'rgba(249,115,22,.08)',  color: 'var(--risk-high)', iconBg: 'rgba(249,115,22,.15)' },
  critical: { border: 'var(--risk-crit)', bg: 'rgba(239,68,68,.08)',   color: 'var(--risk-crit)', iconBg: 'rgba(239,68,68,.15)' },
};

const TYPE_ICONS: Record<string, string> = {
  heavy_rain:   '🌧',
  storm:        '⛈',
  extreme_heat: '🔥',
  frost:        '❄️',
  high_wind:    '💨',
  unknown:      '⚠️',
};

const TYPE_LABELS: Record<string, string> = {
  heavy_rain:   'Heavy Rain Warning',
  storm:        'Storm Alert',
  extreme_heat: 'Extreme Heat',
  frost:        'Frost Warning',
  high_wind:    'High Wind Speed',
  unknown:      'Weather Alert',
};

const COLLAPSE_THRESHOLD = 3;

function relativeTime(isoStr: string): string {
  const diff = Date.now() - new Date(isoStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1)  return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24)  return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function AlertRow({ alert, onDismiss }: { alert: WeatherAlert; onDismiss: (id: string) => void }) {
  const s = SEVERITY_STYLES[alert.severity];
  return (
    <div
      className="flex items-start gap-3 px-4 py-3 rounded-lg"
      style={{ background: s.bg, border: `1px solid ${s.border}`, borderLeft: `3px solid ${s.border}` }}
    >
      <span
        className="flex-shrink-0 flex items-center justify-center rounded-full text-base"
        style={{ width: 28, height: 28, background: s.iconBg, marginTop: 1 }}
      >
        {TYPE_ICONS[alert.type] ?? '⚠️'}
      </span>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5 flex-wrap">
          <span className="font-semibold text-xs uppercase tracking-wide" style={{ color: s.color }}>
            {TYPE_LABELS[alert.type] ?? 'Weather Alert'}
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {relativeTime(alert.receivedAt)}
          </span>
        </div>
        <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>{alert.message}</p>
      </div>

      <button
        onClick={() => onDismiss(alert.id)}
        title="Dismiss alert"
        className="flex-shrink-0 cursor-pointer transition-opacity hover:opacity-60"
        style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1rem', padding: 4, marginTop: -2 }}
      >
        ✕
      </button>
    </div>
  );
}

export default function AlertsBanner({ alerts, onDismiss, onDismissAll }: Props) {
  const [expanded, setExpanded] = useState(false);

  if (!alerts.length) return null;

  const showToggle  = alerts.length > COLLAPSE_THRESHOLD;
  const visible     = showToggle && !expanded ? alerts.slice(0, COLLAPSE_THRESHOLD) : alerts;
  const hiddenCount = alerts.length - COLLAPSE_THRESHOLD;

  return (
    <div className="mb-4" role="region" aria-label="Weather alerts">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2 text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--risk-crit)' }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
            <line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" />
          </svg>
          Active Alerts ({alerts.length})
        </div>
        <button
          onClick={onDismissAll}
          className="text-xs cursor-pointer transition-opacity hover:opacity-70"
          style={{ background: 'none', border: 'none', color: 'var(--muted)', textDecoration: 'underline' }}
        >
          Dismiss all
        </button>
      </div>

      <div className="flex flex-col gap-2">
        {visible.map(a => <AlertRow key={a.id} alert={a} onDismiss={onDismiss} />)}
      </div>

      {showToggle && (
        <button
          onClick={() => setExpanded(e => !e)}
          className="mt-2 text-xs cursor-pointer transition-opacity hover:opacity-70 w-full text-center py-1.5 rounded-lg"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          {expanded ? 'Show fewer ▲' : `Show ${hiddenCount} more alert${hiddenCount !== 1 ? 's' : ''} ▼`}
        </button>
      )}
    </div>
  );
}
