'use client';

import { useState } from 'react';
import type { WeatherData, FarmState, DailyForecast, HourlyForecast } from '@/lib/types';
import {
  computeRisks, buildRecommendations, riskBarColor,
  fmtTemp, fmtWind, fmtPrecip, degreesToCardinal,
  estimateCropStage, buildStageAdvice,
  FARM_SIZES, SOIL_TYPES, CROP_VARIETIES,
} from '@/lib/weather-utils';

interface Props {
  farmState: FarmState;
  weatherData: WeatherData | null;
  onCropChange: (crop: string) => void;
  onFarmStateChange: (updates: Partial<FarmState>) => void;
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
  { value: 'sugarcane',  icon: '🎋', label: 'Cane'       },
  { value: 'flowers',    icon: '🌸', label: 'Flowers'    },
  { value: 'bananas',    icon: '🍌', label: 'Bananas'    },
  { value: 'greengrams', icon: '🫛', label: 'Gr. Grams'  },
  { value: 'cowpeas',    icon: '🌿', label: 'Cowpeas'    },
  { value: 'sorghum',    icon: '🌾', label: 'Sorghum'    },
  { value: 'cassava',    icon: '🥬', label: 'Cassava'    },
  { value: 'mangoes',    icon: '🥭', label: 'Mangoes'    },
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

export default function CenterPanel({ farmState, weatherData, onCropChange, onFarmStateChange, isFetching }: Props) {
  const daily  = (weatherData?.daily  ?? []) as DailyForecast[];
  const hourly = (weatherData?.hourly ?? []) as HourlyForecast[];
  const cur    = weatherData?.current ?? {};

  const [detailsOpen, setDetailsOpen] = useState(true);

  const risks = daily.length
    ? computeRisks(daily, farmState.crop || 'general', farmState.units)
    : null;
  const recs = risks ? buildRecommendations(risks, daily, farmState.crop || 'general') : [];

  const cropStage = farmState.plantingDate
    ? estimateCropStage(farmState.crop || 'general', farmState.plantingDate)
    : null;
  const stageRecs = cropStage && risks
    ? buildStageAdvice(cropStage, risks, farmState.crop || 'general', farmState.irrigationType)
    : [];

  const cropVarieties = CROP_VARIETIES[farmState.crop] ?? [];
  const upd = (key: keyof FarmState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      onFarmStateChange({ [key]: e.target.value || undefined });

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

        {/* ── Crop Details ──────────────────────────────────────── */}
        <section>
          <div className="sec-head" style={{ cursor: 'pointer' }} onClick={() => setDetailsOpen(o => !o)}>
            <span style={{ fontSize: 14 }}>📋</span>
            <span className="sec-head-label">Crop Details</span>
            <div className="sec-head-line" />
            <span className="text-xs ml-2 shrink-0" style={{ color: 'var(--muted)' }}>
              {detailsOpen ? '▲' : '▼'}
            </span>
          </div>

          {detailsOpen && (
            <div className="flex flex-col gap-4 fade-in">
              {/* Row 1: Planting Date + Farm Size */}
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Planting Date
                  </label>
                  <input
                    type="date"
                    value={farmState.plantingDate ?? ''}
                    max={new Date().toISOString().slice(0, 10)}
                    onChange={upd('plantingDate')}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text)', outline: 'none' }}
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Farm Size
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {FARM_SIZES.map(s => (
                      <button
                        key={s}
                        onClick={() => onFarmStateChange({ farmSize: farmState.farmSize === s ? undefined : s })}
                        className="px-2 py-1 rounded-lg text-[10px] font-semibold cursor-pointer transition-all"
                        style={{
                          background: farmState.farmSize === s ? 'rgba(74,222,128,.15)' : 'var(--surface)',
                          border: farmState.farmSize === s ? '1px solid var(--green)' : '1px solid var(--border)',
                          color: farmState.farmSize === s ? 'var(--green)' : 'var(--text2)',
                        }}
                      >{s}</button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Row 2: Water Source */}
              <div>
                <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                  Water Source
                </label>
                <div className="flex gap-2">
                  {(['rain_fed', 'irrigated'] as const).map(opt => (
                    <button
                      key={opt}
                      onClick={() => onFarmStateChange({ irrigationType: farmState.irrigationType === opt ? undefined : opt })}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold cursor-pointer transition-all flex-1 justify-center"
                      style={{
                        background: farmState.irrigationType === opt ? 'rgba(74,222,128,.15)' : 'var(--surface)',
                        border: farmState.irrigationType === opt ? '1px solid var(--green)' : '1px solid var(--border)',
                        color: farmState.irrigationType === opt ? 'var(--green)' : 'var(--text2)',
                      }}
                    >
                      <span>{opt === 'rain_fed' ? '🌧' : '🚿'}</span>
                      {opt === 'rain_fed' ? 'Rain-fed' : 'Irrigated'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row 3: Soil Type + Crop Variety (optional) */}
              <div className="grid gap-3" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Soil Type <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  <select
                    value={farmState.soilType ?? ''}
                    onChange={upd('soilType')}
                    className="w-full px-3 py-2 rounded-lg text-sm"
                    style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: farmState.soilType ? 'var(--text)' : 'var(--muted)', outline: 'none' }}
                  >
                    <option value="">Select soil type</option>
                    {SOIL_TYPES.map(t => <option key={t} value={t} style={{ background: 'var(--bg2)' }}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] uppercase tracking-widest font-semibold mb-1.5" style={{ color: 'var(--muted)' }}>
                    Crop Variety <span style={{ color: 'var(--muted)', fontWeight: 400 }}>(optional)</span>
                  </label>
                  {cropVarieties.length > 0 ? (
                    <select
                      value={farmState.cropVariety ?? ''}
                      onChange={upd('cropVariety')}
                      className="w-full px-3 py-2 rounded-lg text-sm"
                      style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: farmState.cropVariety ? 'var(--text)' : 'var(--muted)', outline: 'none' }}
                    >
                      <option value="">Select variety</option>
                      {cropVarieties.map(v => <option key={v} value={v} style={{ background: 'var(--bg2)' }}>{v}</option>)}
                    </select>
                  ) : (
                    <div className="px-3 py-2 rounded-lg text-sm" style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}>
                      No varieties listed
                    </div>
                  )}
                </div>
              </div>

              {/* ── Estimated Crop Stage ──────────────────────────── */}
              {cropStage ? (
                <div
                  className="rounded-xl p-4 fade-in"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
                >
                  <div className="flex items-center gap-2 mb-3">
                    <span style={{ fontSize: 13 }}>🌱</span>
                    <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
                      Estimated Crop Stage
                    </span>
                  </div>
                  <div className="flex items-center gap-3 mb-3">
                    <span className="text-2xl">{cropStage.icon}</span>
                    <div>
                      <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{cropStage.name}</div>
                      <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
                        {cropStage.isPerennial
                          ? 'Established perennial crop'
                          : `Day ${cropStage.daysAfterPlanting} of ~${cropStage.totalDays}`}
                      </div>
                    </div>
                    {!cropStage.isPerennial && (
                      <div className="ml-auto text-right">
                        <div className="text-sm font-bold" style={{ color: 'var(--green)' }}>{cropStage.pct}%</div>
                        <div className="text-[9px]" style={{ color: 'var(--muted)' }}>growth</div>
                      </div>
                    )}
                  </div>
                  {!cropStage.isPerennial && (
                    <div className="h-1.5 rounded-full overflow-hidden mb-4" style={{ background: 'var(--border)' }}>
                      <div
                        className="h-full rounded-full transition-all duration-700"
                        style={{ width: cropStage.pct + '%', background: 'var(--green)' }}
                      />
                    </div>
                  )}
                  {stageRecs.length > 0 && (
                    <div className="flex flex-col gap-2">
                      {stageRecs.map((r, i) => (
                        <div
                          key={i}
                          className="flex items-start gap-3 px-3 py-2.5 rounded-xl text-sm leading-relaxed"
                          style={{
                            background: ACTION_BG[r.cls],
                            border: `1px solid ${ACTION_BORDER[r.cls]}22`,
                            borderLeft: `3px solid ${ACTION_BORDER[r.cls]}`,
                          }}
                        >
                          <span className="text-base shrink-0 mt-px">{r.icon}</span>
                          <span style={{ color: 'var(--text2)' }}>{r.text}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div
                  className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm"
                  style={{ background: 'var(--surface)', border: '1px dashed var(--border)', color: 'var(--muted)' }}
                >
                  <span>📅</span>
                  <span>Add a planting date above to see your estimated crop stage and stage-specific advice.</span>
                </div>
              )}
            </div>
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
