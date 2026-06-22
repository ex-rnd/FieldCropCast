'use client';

import type { FarmState } from '@/lib/types';

interface SetupFormProps {
  farmState: FarmState;
  onChange: (s: FarmState) => void;
  onAnalyze: (s: FarmState) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  hasData: boolean;
}

const CROPS = [
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

export default function SetupForm({ farmState, onChange, onAnalyze, collapsed, onToggleCollapse, hasData }: SetupFormProps) {
  const upd = (key: keyof FarmState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onChange({ ...farmState, [key]: e.target.value });

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
              {CROPS.map(c => (
                <option key={c.value} value={c.value} style={{ background: 'var(--bg2)' }}>{c.label}</option>
              ))}
            </select>
          </Field>
          <Field label="Units">
            <select className="form-input" value={farmState.units} onChange={upd('units') as any}>
              <option value="metric"   style={{ background: 'var(--bg2)' }}>Metric (°C, km/h)</option>
              <option value="imperial" style={{ background: 'var(--bg2)' }}>Imperial (°F, mph)</option>
            </select>
          </Field>

          <button
            onClick={() => onAnalyze(farmState)}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-black text-sm tracking-wide cursor-pointer transition-opacity hover:opacity-90 active:scale-[.98]"
            style={{ gridColumn: '1 / -1', background: 'var(--green)', border: 'none', color: '#0c1a0e' }}
          >
            <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
            Analyze Farm Conditions
          </button>
        </div>
      )}
    </div>
  );
}
