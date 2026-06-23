'use client';

import { useState } from 'react';
import type { FarmState } from '@/lib/types';
import type { CropOption, UnitOption } from '@/app/page';

interface SetupFormProps {
  farmState: FarmState;
  onChange: (s: FarmState) => void;
  onAnalyze: (s: FarmState) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  hasData: boolean;
  isFetching?: boolean;
  crops?: CropOption[];
  units?: UnitOption[];
}

const DEFAULT_CROPS: CropOption[] = [
  { value: 'general',   label: 'General / Mixed' },
  { value: 'maize',     label: 'Maize' },
  { value: 'tea',       label: 'Tea' },
  { value: 'coffee',    label: 'Coffee' },
  { value: 'wheat',     label: 'Wheat' },
  { value: 'rice',      label: 'Rice' },
  { value: 'beans',     label: 'Beans' },
  { value: 'tomatoes',  label: 'Tomatoes' },
  { value: 'potatoes',  label: 'Potatoes' },
  { value: 'sugarcane', label: 'Sugarcane' },
  { value: 'flowers',   label: 'Cut Flowers' },
];

const DEFAULT_UNITS: UnitOption[] = [
  { value: 'metric',   label: 'Metric (°C, km/h)' },
  { value: 'imperial', label: 'Imperial (°F, mph)' },
];

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs uppercase tracking-widest font-medium" style={{ color: 'var(--muted)' }}>
        {label}
      </label>
      {children}
    </div>
  );
}

export default function SetupForm({
  farmState, onChange, onAnalyze,
  collapsed, onToggleCollapse, hasData,
  isFetching = false,
  crops = DEFAULT_CROPS,
  units = DEFAULT_UNITS,
}: SetupFormProps) {
  const upd = (key: keyof FarmState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...farmState, [key]: e.target.value });

  const [copied, setCopied] = useState(false);

  const webhookUrl =
    (typeof window !== 'undefined'
      ? window.location.origin
      : (process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000')
    ) + '/backend/api/alerts/webhook';

  const handleCopy = () => {
    navigator.clipboard.writeText(webhookUrl).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }).catch(() => {});
  };

  return (
    <div className="card mb-5 p-6">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2 text-base font-bold" style={{ color: 'var(--green)' }}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          Farm Setup
        </div>
        {hasData && (
          <button
            onClick={onToggleCollapse}
            className="text-xs underline cursor-pointer"
            style={{ background: 'none', border: 'none', color: 'var(--muted)' }}
          >
            {collapsed ? 'Expand ▼' : 'Collapse ▲'}
          </button>
        )}
      </div>

      {!collapsed && (
        <div className="grid gap-3.5" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))' }}>
          <Field label="Farm Name">
            <input className="form-input" placeholder="e.g. Kapkimolwa Farm" value={farmState.name} onChange={upd('name')} />
          </Field>
          <Field label="County / Region">
            <input className="form-input" placeholder="e.g. Bomet" value={farmState.county} onChange={upd('county')} />
          </Field>
          <Field label="Latitude">
            <input className="form-input" type="number" step="any" placeholder="-0.7893" value={farmState.lat} onChange={upd('lat')} />
          </Field>
          <Field label="Longitude">
            <input className="form-input" type="number" step="any" placeholder="35.7890" value={farmState.lon} onChange={upd('lon')} />
          </Field>
          <Field label="Primary Crop">
            <select className="form-input" value={farmState.crop} onChange={upd('crop')}>
              {crops.map(c => (
                <option key={c.value} value={c.value} style={{ background: 'var(--bg2)' }}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Units">
            <select className="form-input" value={farmState.units} onChange={upd('units') as any}>
              {units.map(u => (
                <option key={u.value} value={u.value} style={{ background: 'var(--bg2)' }}>{u.label}</option>
              ))}
            </select>
          </Field>

          <button
            onClick={() => onAnalyze(farmState)}
            disabled={isFetching}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black text-sm tracking-wide cursor-pointer transition-opacity hover:opacity-90 active:scale-[.98] disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ gridColumn: '1 / -1', background: 'var(--green)', border: 'none', color: '#0c1a0e' }}
          >
            {isFetching ? (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  style={{ animation: 'spin .7s linear infinite' }}>
                  <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                  <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
                </svg>
                Fetching…
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                Analyze Farm Conditions
              </>
            )}
          </button>

          {/* Webhook URL display */}
          <div style={{ gridColumn: '1 / -1' }}>
            <div className="text-xs uppercase tracking-widest font-medium mb-1.5" style={{ color: 'var(--muted)' }}>
              Your WeatherAI Webhook URL
            </div>
            <div
              className="flex items-center gap-2 px-3 py-2.5 rounded-lg"
              style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
            >
              <span className="flex-1 truncate text-xs font-mono" style={{ color: 'var(--text2)' }}>{webhookUrl}</span>
              <button
                type="button"
                onClick={handleCopy}
                className="shrink-0 px-2.5 py-1 rounded text-xs font-medium cursor-pointer transition-all"
                style={{
                  background: copied ? 'rgba(74,222,128,.15)' : 'var(--surface)',
                  border: `1px solid ${copied ? 'var(--green)' : 'var(--border)'}`,
                  color: copied ? 'var(--green)' : 'var(--muted)',
                }}
              >
                {copied ? '✓ Copied' : 'Copy'}
              </button>
            </div>
            <p className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
              Paste this URL into the WeatherAI dashboard &rarr; Webhooks &amp; Alerts.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
