'use client';

import type { WeatherData, FarmState, DailyForecast, HourlyForecast } from '@/lib/types';
import {
  computeRisks, buildRecommendations, riskBarColor,
  fmtTemp, fmtWind, fmtPrecip, degreesToCardinal,
} from '@/lib/weather-utils';

interface Props {
  farmState: FarmState;
  weatherData: WeatherData | null;
  onCropChange: (crop: string) => void;
  isFetching: boolean;
}

// ── Crop catalogue ────────────────────────────────────────────────────
const CROPS = [
  { value: 'general',   icon: '🌱', label: 'General'  },
  { value: 'maize',     icon: '🌽', label: 'Maize'    },
  { value: 'tea',       icon: '🍵', label: 'Tea'      },
  { value: 'coffee',    icon: '☕', label: 'Coffee'   },
  { value: 'wheat',     icon: '🌾', label: 'Wheat'    },
  { value: 'rice',      icon: '🍚', label: 'Rice'     },
  { value: 'beans',     icon: '🫘', label: 'Beans'    },
  { value: 'tomatoes',  icon: '🍅', label: 'Tomatoes' },
  { value: 'potatoes',  icon: '🥔', label: 'Potatoes' },
  { value: 'sugarcane', icon: '🎋', label: 'Cane'     },
  { value: 'flowers',   icon: '🌸', label: 'Flowers'  },
];

const RISK_COLOR: Record<string, string> = {
  low:      'var(--risk-low)',
  moderate: 'var(--risk-mod)',
  high:     'var(--risk-high)',
  critical: 'var(--risk-crit)',
};

const ACTION_BORDER: Record<string, string> = {
  urgent:  'var(--risk-crit)',
  warning: 'var(--risk-high)',
  caution: 'var(--risk-mod)',
  good:    'var(--risk-low)',
};

const ACTION_BG: Record<string, string> = {
  urgent:  'rgba(239,68,68,.06)',
  warning: 'rgba(249,115,22,.06)',
  caution: 'rgba(251,191,36,.06)',
  good:    'rgba(74,222,128,.06)',
};

function SectionHead({ icon, title }: { icon: string; title: string }) {
  return (
    <div className="sec-head">
      <span style={{ fontSize: 14 }}>{icon}</span>
      <span className="sec-head-label">{title}</span>
      <div className="sec-head-line" />
    </div>
  );
}

export default function CenterPanel({ farmState, weatherData, onCropChange, isFetching }: Props) {
  const daily  = (weatherData?.daily  ?? []) as DailyForecast[];
  const hourly = (weatherData?.hourly ?? []) as HourlyForecast[];
  const cur    = weatherData?.current ?? {};

  const risks = daily.length
    ? computeRisks(daily, farmState.crop || 'general', farmState.units)
    : null;
  const recs = risks ? buildRecommendations(risks, daily, farmState.crop || 'general') : [];

  const now     = new Date();
  const curHour = hourly.find(h => {
    const d = new Date(h.time);
    return d.toDateString() === now.toDateString() && d.getHours() === now.getHours();
  }) || hourly[0] || {} as HourlyForecast;

  const windDir = degreesToCardinal(cur.wind_direction ?? curHour.wind_direction);
  const uvIdx   = curHour.uv_index ?? 0;
  const uvLbl   = uvIdx <= 2 ? 'Low' : uvIdx <= 5 ? 'Moderate' : uvIdx <= 7 ? 'High' : 'Very High';

  return (
    <div className="fc-center">
      <div className="p-6 max-w-2xl mx-auto flex flex-col gap-8">

        {/* ── Crop Selector ─────────────────────────────────────── */}
        <section>
          <SectionHead icon="🌱" title="Select Your Crop" />
          <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(4, 1fr)' }}>
            {CROPS.map(c => (
              <button
                key={c.value}
                onClick={() => onCropChange(c.value)}
                className={`crop-btn ${farmState.crop === c.value ? 'selected' : ''}`}
              >
                <span className="crop-icon">{c.icon}</span>
                <span className="crop-label">{c.label}</span>
              </button>
            ))}
          </div>
          {farmState.crop && farmState.crop !== 'general' && (
            <p className="text-xs mt-3 px-1 fade-in" style={{ color: 'var(--muted)' }}>
              Showing risk thresholds and recommendations optimised for <strong style={{ color: 'var(--text2)' }}>
                {CROPS.find(c => c.value === farmState.crop)?.label ?? farmState.crop}
              </strong>.
            </p>
          )}
        </section>

        {/* ── Risk Overview ─────────────────────────────────────── */}
        {risks && (
          <section className="fade-in">
            <SectionHead icon="⚠️" title="7-Day Risk Assessment" />
            <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {([
                { key: 'rain', icon: '🌧', label: 'Rain' },
                { key: 'wind', icon: '💨', label: 'Wind' },
                { key: 'temp', icon: '🌡', label: 'Heat / Frost' },
              ] as const).map(({ key, icon, label }) => {
                const r = risks[key];
                return (
                  <div
                    key={key}
                    className="p-4 rounded-2xl"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
                  >
                    <div className="text-2xl mb-2">{icon}</div>
                    <div className="text-xs uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>{label}</div>
                    <div className="text-lg font-black" style={{ color: RISK_COLOR[r.level] }}>
                      {r.level.charAt(0).toUpperCase() + r.level.slice(1)}
                    </div>
                    <div className="h-1.5 rounded-full mt-2 mb-2" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{ width: Math.min(100, r.score) + '%', background: riskBarColor(r.level) }}
                      />
                    </div>
                    <div className="text-[10px] leading-relaxed" style={{ color: 'var(--muted)' }}>{r.detail}</div>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Field Recommendations ─────────────────────────────── */}
        <section>
          <SectionHead icon="✅" title="Field Recommendations" />
          {recs.length > 0 ? (
            <div className="flex flex-col gap-2 fade-in">
              {recs.map((r, i) => (
                <div
                  key={i}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl text-sm leading-relaxed"
                  style={{
                    background: ACTION_BG[r.cls],
                    border: `1px solid ${ACTION_BORDER[r.cls]}22`,
                    borderLeft: `3px solid ${ACTION_BORDER[r.cls]}`,
                  }}
                >
                  <span className="text-lg shrink-0 mt-px">{r.icon}</span>
                  <span style={{ color: 'var(--text2)' }}>{r.text}</span>
                </div>
              ))}
            </div>
          ) : !weatherData ? (
            <div
              className="flex flex-col items-center gap-3 py-10 rounded-2xl text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="text-4xl">📋</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>No recommendations yet</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  Analyse your farm to get field-specific recommendations.
                </p>
              </div>
            </div>
          ) : (
            <p className="text-xs py-2" style={{ color: 'var(--muted)' }}>
              No specific recommendations for current conditions. Fields look good!
            </p>
          )}
        </section>

        {/* ── Current Conditions ────────────────────────────────── */}
        <section>
          <SectionHead icon="🌡" title="Current Conditions" />
          {weatherData ? (
            <div className="grid gap-3 fade-in" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
              {[
                { icon: '💧', val: curHour.humidity != null ? curHour.humidity + '%' : '—',          lbl: 'Humidity'    },
                { icon: '💨', val: cur.wind_speed != null ? fmtWind(cur.wind_speed, farmState.units) + (windDir ? ' ' + windDir : '') : '—', lbl: 'Wind Speed' },
                { icon: '☀️', val: `${uvIdx} — ${uvLbl}`,                                            lbl: 'UV Index'    },
                { icon: '🌧', val: daily[0] ? fmtPrecip(daily[0].precipitation_sum, farmState.units) : '—', lbl: "Precip Today" },
                { icon: '🌡', val: curHour.feels_like != null ? fmtTemp(curHour.feels_like, farmState.units) : '—', lbl: 'Feels Like' },
                { icon: '🌬', val: curHour.precipitation_probability != null ? curHour.precipitation_probability + '%' : '—', lbl: 'Rain Chance' },
              ].map(m => (
                <div key={m.lbl} className="metric-card">
                  <div style={{ fontSize: 22, marginBottom: 6 }}>{m.icon}</div>
                  <div className="text-lg font-black" style={{ color: 'var(--text)' }}>{m.val}</div>
                  <div className="text-[10px] uppercase tracking-wider mt-1" style={{ color: 'var(--muted)' }}>{m.lbl}</div>
                </div>
              ))}
            </div>
          ) : (
            <div
              className="flex flex-col items-center gap-3 py-10 rounded-2xl text-center"
              style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            >
              <div className="text-4xl">🌤</div>
              <div>
                <p className="text-sm font-semibold" style={{ color: 'var(--text2)' }}>No data loaded</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
                  {isFetching ? 'Fetching weather data…' : 'Complete farm setup to see live conditions.'}
                </p>
              </div>
              {isFetching && <div className="spinner" style={{ width: 28, height: 28, borderWidth: 2 }} />}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
