'use client';

import type { WeatherData, FarmState, UsageData, DailyForecast, HourlyForecast } from '@/lib/types';
import {
  wmoIcon, wmoText, isDaytime, dayName, localHour,
  fmtTemp, fmtWind, fmtPrecip, degreesToCardinal,
  computeRisks, buildRecommendations, generateSummary, riskBarColor,
} from '@/lib/weather-utils';

interface Props {
  data: WeatherData;
  farmState: FarmState;
  usageData: UsageData | null;
}

const RISK_LEVEL_COLOR: Record<string, string> = {
  low: 'var(--risk-low)',
  moderate: 'var(--risk-mod)',
  high: 'var(--risk-high)',
  critical: 'var(--risk-crit)',
};

const ACTION_BORDER: Record<string, string> = {
  urgent:  'var(--risk-crit)',
  warning: 'var(--risk-high)',
  caution: 'var(--risk-mod)',
  good:    'var(--risk-low)',
};

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <div className="text-xs uppercase tracking-widest mb-2.5 px-0.5 font-medium" style={{ color: 'var(--muted)' }}>
      {children}
    </div>
  );
}

export default function Dashboard({ data, farmState, usageData }: Props) {
  const cur    = data.current  || {};
  const loc    = data.location || {};
  const daily  = (data.daily   || []) as DailyForecast[];
  const hourly = (data.hourly  || []) as HourlyForecast[];
  const ai     = data.ai_summary || data.summary || generateSummary(data, farmState);
  const isDay  = isDaytime(daily);
  const now    = new Date();
  const units  = farmState.units;

  const curHour = hourly.find(h => {
    const hd = new Date(h.time);
    return hd.toDateString() === now.toDateString() && hd.getHours() === now.getHours();
  }) || hourly[0] || ({} as HourlyForecast);

  const tempC   = cur.temperature ?? curHour.temperature ?? 0;
  const locLabel = [farmState.name, farmState.county || loc.country].filter(Boolean).join(' · ') || loc.country || '—';

  const risks = computeRisks(daily, farmState.crop || 'general', units);
  const recs  = buildRecommendations(risks, daily, farmState.crop || 'general');

  // Wind
  const windDir = degreesToCardinal(cur.wind_direction ?? curHour.wind_direction);
  const uvIdx   = curHour.uv_index ?? 0;
  const uvLbl   = uvIdx <= 2 ? 'Low' : uvIdx <= 5 ? 'Mod' : uvIdx <= 7 ? 'High' : 'V.Hi';

  // Hourly slice (next 24h from current hour)
  let startIdx = 0;
  for (let i = 0; i < hourly.length; i++) {
    if (new Date(hourly[i].time) >= new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours())) {
      startIdx = i; break;
    }
  }
  const next24 = hourly.slice(startIdx, startIdx + 24);

  // Usage
  const plan    = usageData?.plan || 'free';
  const period  = usageData?.period  || {};
  const limits  = usageData?.limits  || {};
  const rem     = usageData?.remaining || {};
  const used    = period.requestCount   || 0;
  const limit   = limits.requests       || 1000;
  const left    = rem.requests          != null ? rem.requests   : (limit - used);
  const aiUsed  = period.aiRequestCount || 0;
  const aiLimit = limits.aiRequests     || 200;
  const aiLeft  = rem.aiRequests        != null ? rem.aiRequests : (aiLimit - aiUsed);
  const reqPct  = limit ? Math.round((used / limit) * 100) : 0;
  const aiPct   = aiLimit ? Math.round((aiUsed / aiLimit) * 100) : 0;
  const barClass = (pct: number) => pct >= 90 ? 'var(--risk-crit)' : pct >= 70 ? 'var(--amber)' : 'var(--green)';

  return (
    <div>

      {/* ── Hero ───────────────────────────────────────────────────── */}
      <div className="card mb-4 p-7 grid gap-4 items-center" style={{ gridTemplateColumns: '1fr auto' }}>
        <div>
          <div className="text-xs uppercase tracking-widest mb-1" style={{ color: 'var(--muted)' }}>{locLabel}</div>
          <div
            className="font-extralight leading-none tracking-[-3px]"
            style={{ fontSize: 'clamp(4rem,12vw,6.5rem)', color: 'var(--text)' }}
          >
            {units === 'imperial' ? Math.round(tempC * 9 / 5 + 32) + '°' : Math.round(tempC) + '°'}
          </div>
          <div className="text-lg mt-1.5" style={{ color: 'var(--sky)' }}>
            {wmoText(cur.condition_code ?? curHour.condition_code ?? 0)}
          </div>
          {curHour.feels_like != null && (
            <div className="text-sm mt-1" style={{ color: 'var(--muted)' }}>
              Feels like {fmtTemp(curHour.feels_like, units)}
            </div>
          )}
          {cur.time && (
            <div className="text-xs mt-1.5" style={{ color: 'var(--muted)' }}>
              Local time · {cur.time.replace('T', ' ')}
            </div>
          )}
        </div>
        <div className="text-right" style={{ fontSize: 'clamp(4rem,12vw,7rem)', lineHeight: 1 }}>
          {wmoIcon(cur.condition_code ?? curHour.condition_code ?? 0, isDay)}
        </div>
      </div>

      {/* ── Risk Assessment ─────────────────────────────────────────── */}
      <SectionTitle>⚠ Risk Assessment — Next 7 Days</SectionTitle>
      <div className="grid gap-3 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px,1fr))' }}>
        {([
          { key: 'rain', icon: '🌧', label: 'Rain Risk' },
          { key: 'wind', icon: '💨', label: 'Wind Risk' },
          { key: 'temp', icon: '🌡', label: 'Heat / Frost Risk' },
        ] as const).map(({ key, icon, label }) => {
          const r = risks[key];
          return (
            <div key={key} className="card p-5">
              <div className="flex items-center gap-2.5 mb-3">
                <span className="text-2xl">{icon}</span>
                <span className="text-xs uppercase tracking-widest" style={{ color: 'var(--muted)' }}>{label}</span>
              </div>
              <div className="text-2xl font-black tracking-tight mb-0.5" style={{ color: RISK_LEVEL_COLOR[r.level] }}>
                {r.level.charAt(0).toUpperCase() + r.level.slice(1)}
              </div>
              <div className="h-1.5 rounded-full my-2.5" style={{ background: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: Math.min(100, r.score) + '%', background: riskBarColor(r.level) }}
                />
              </div>
              <div className="text-xs leading-relaxed" style={{ color: 'var(--muted)' }}>{r.detail}</div>
            </div>
          );
        })}
      </div>

      {/* ── Recommendations ─────────────────────────────────────────── */}
      <div className="card mb-4 p-6">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider font-bold mb-3.5" style={{ color: 'var(--amber)' }}>
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 12l2 2 4-4" /><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20z" />
          </svg>
          Field Recommendations
        </div>
        <div className="flex flex-col gap-2">
          {recs.map((r, i) => (
            <div
              key={i}
              className="flex items-start gap-3 px-3.5 py-2.5 rounded-lg text-sm leading-relaxed"
              style={{ background: 'var(--bg2)', borderLeft: `3px solid ${ACTION_BORDER[r.cls]}`, color: 'var(--text2)' }}
            >
              <span className="text-base flex-shrink-0 mt-0.5">{r.icon}</span>
              <span>{r.text}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── AI Summary ──────────────────────────────────────────────── */}
      <div className="card mb-4 p-5">
        <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold mb-2" style={{ color: 'var(--green)' }}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
          AI-Generated Summary
        </div>
        <p className="text-sm leading-7" style={{ color: 'var(--text2)' }}>
          {ai || 'Weather data loaded. Enable AI summaries on a supported plan for Gemini-generated insights.'}
        </p>
      </div>

      {/* ── Metrics ─────────────────────────────────────────────────── */}
      <SectionTitle>Current Conditions</SectionTitle>
      <div className="grid gap-2.5 mb-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(130px,1fr))' }}>
        {[
          { icon: '💧', val: curHour.humidity != null ? curHour.humidity + '%' : '—', lbl: 'Humidity' },
          { icon: '💨', val: fmtWind(cur.wind_speed ?? curHour.wind_speed, units) + (windDir ? ' ' + windDir : ''), lbl: 'Wind' },
          { icon: '🌡', val: '—', lbl: 'Pressure' },
          { icon: '☀️', val: uvIdx + ' · ' + uvLbl, lbl: 'UV Index' },
          { icon: '👁',  val: '—', lbl: 'Visibility' },
          { icon: '🌧', val: daily[0] ? fmtPrecip(daily[0].precipitation_sum, units) : '—', lbl: 'Precipitation' },
        ].map(m => (
          <div key={m.lbl} className="card py-4 px-3 text-center">
            <div className="text-2xl mb-1">{m.icon}</div>
            <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>{m.val}</div>
            <div className="text-[0.7rem] uppercase tracking-wider mt-0.5" style={{ color: 'var(--muted)' }}>{m.lbl}</div>
          </div>
        ))}
      </div>

      {/* ── 7-Day Forecast ──────────────────────────────────────────── */}
      <SectionTitle>7-Day Forecast</SectionTitle>
      <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: 'repeat(7, 1fr)' }}>
        {daily.slice(0, 7).map((day) => {
          const isToday = new Date(day.date + 'T12:00:00').toDateString() === now.toDateString();
          return (
            <div
              key={day.date}
              className="card py-3 px-1.5 text-center transition-all hover:-translate-y-0.5"
              style={{ cursor: 'default' }}
            >
              <div className="text-[0.7rem] uppercase mb-1" style={{ color: 'var(--muted)' }}>
                {isToday ? 'Today' : dayName(day.date)}
              </div>
              <div className="text-2xl my-1">{wmoIcon(day.condition_code, true)}</div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmtTemp(day.temp_max, units)}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--muted)' }}>{fmtTemp(day.temp_min, units)}</div>
              {day.precipitation_probability != null && (
                <div className="text-[0.68rem] mt-1" style={{ color: 'var(--sky)' }}>
                  💧 {day.precipitation_probability}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Hourly ──────────────────────────────────────────────────── */}
      <SectionTitle>Next 24 Hours</SectionTitle>
      <div className="hourly-scroll mb-4">
        {next24.map((h, i) => {
          let hIsDay = isDay;
          if (daily.length) {
            const hDate = new Date(h.time);
            const dayEntry = daily.find(d => d.date === hDate.toISOString().slice(0, 10));
            if (dayEntry?.sunrise && dayEntry?.sunset) {
              hIsDay = hDate >= new Date(dayEntry.sunrise) && hDate <= new Date(dayEntry.sunset);
            }
          }
          return (
            <div
              key={h.time}
              className="flex-none rounded-xl py-3 px-1.5 text-center"
              style={{
                width: 66,
                background: i === 0 ? 'rgba(74,222,128,.12)' : undefined,
                border: i === 0 ? '1px solid rgba(74,222,128,.25)' : '1px solid transparent',
              }}
            >
              <div className="text-[0.68rem] mb-1.5" style={{ color: 'var(--muted)' }}>
                {i === 0 ? 'Now' : localHour(h.time)}
              </div>
              <div className="text-xl mb-0.5">{wmoIcon(h.condition_code, hIsDay)}</div>
              <div className="text-sm font-bold" style={{ color: 'var(--text)' }}>{fmtTemp(h.temperature, units)}</div>
              {h.precipitation_probability != null && (
                <div className="text-[0.65rem] mt-0.5" style={{ color: 'var(--sky)' }}>
                  💧{h.precipitation_probability}%
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Usage Widget ────────────────────────────────────────────── */}
      {usageData && (
        <div className="card mb-4 p-5">
          <div className="flex items-center justify-between mb-3.5 flex-wrap gap-2">
            <div className="flex items-center gap-1.5 text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--green)' }}>
              <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d="M3 3h18v18H3z" /><path d="M3 9h18M3 15h18M9 3v18" />
              </svg>
              API Usage &amp; Quota
            </div>
            <span
              className="text-xs px-2.5 py-0.5 rounded-full"
              style={{ background: 'rgba(74,222,128,.15)', color: 'var(--green)', border: '1px solid rgba(74,222,128,.3)' }}
            >
              {plan.charAt(0).toUpperCase() + plan.slice(1)}
            </span>
          </div>
          <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(120px,1fr))' }}>
            {[
              { lbl: 'Requests Used', val: used.toLocaleString(), pct: reqPct },
              { lbl: 'Requests Left', val: left.toLocaleString(), pct: null },
              { lbl: 'AI Requests Used', val: aiUsed.toLocaleString(), pct: aiPct },
              { lbl: 'AI Requests Left', val: aiLeft.toLocaleString(), pct: null },
            ].map(s => (
              <div key={s.lbl}>
                <div className="text-[0.7rem] uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>{s.lbl}</div>
                <div className="text-lg font-bold" style={{ color: 'var(--text)' }}>{s.val}</div>
                {s.pct != null && (
                  <div className="h-1 rounded-full mt-1.5" style={{ background: 'var(--border)' }}>
                    <div className="h-full rounded-full transition-all duration-500" style={{ width: s.pct + '%', background: barClass(s.pct) }} />
                  </div>
                )}
              </div>
            ))}
          </div>
          {period.end && (
            <div className="text-xs mt-2.5" style={{ color: 'var(--muted)' }}>
              Resets {new Date(period.end).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
            </div>
          )}
        </div>
      )}

    </div>
  );
}
