'use client';

import { useState } from 'react';
import { useClerk, useUser } from '@clerk/nextjs';
import type { WeatherData, FarmState, DailyForecast } from '@/lib/types';
import { computeRisks, wmoIcon, fmtTemp, isDaytime } from '@/lib/weather-utils';
import PaymentModal, { type PayPlan } from '@/components/PaymentModal';

interface Props {
  theme: 'dark' | 'light';
  onThemeToggle: () => void;
  farmState: FarmState;
  weatherData: WeatherData | null;
  isRefreshing: boolean;
  isFetching: boolean;
  onRefresh: () => void;
  onResetCache: () => void;
}

const RISK_PILL: Record<string, { cls: string; label: string }> = {
  low:      { cls: 'pill-safe',     label: '🌾 Fields Safe'   },
  moderate: { cls: 'pill-moderate', label: '👀 Monitor Today' },
  high:     { cls: 'pill-high',     label: '⚠️ Take Action'   },
  critical: { cls: 'pill-critical', label: '🚨 Act Now'       },
};

// ── Plan definitions ──────────────────────────────────────────────────
const PLANS = [
  {
    id: 'free',
    recommended: false,
    name: 'Starter',
    badge: 'Free',
    price: 'KES 0',
    period: 'forever',
    color: '#94a3b8',
    glow: 'rgba(148,163,184,.2)',
    features: [
      { label: 'Forecast Days',      value: '7 days'        },
      { label: 'AI Summary',         value: 'Basic · SW'    },
      { label: 'Crop Diagnosis',     value: false           },
      { label: 'Agrovet Care',       value: false           },
      { label: 'Tree Analysis',      value: '5 / month'     },
      { label: 'SMS Alerts',         value: false           },
      { label: 'Webhooks',           value: false           },
      { label: 'Team Seats',         value: '1'             },
    ],
  },
  {
    id: 'pro',
    name: 'Pro',
    badge: 'Popular',
    price: 'KES 1,200',
    period: 'per month',
    color: '#4ade80',
    glow: 'rgba(74,222,128,.25)',
    recommended: true,
    features: [
      { label: 'Forecast Days',      value: '14 days'       },
      { label: 'AI Summary',         value: 'Advanced · SW + EN' },
      { label: 'Crop Diagnosis',     value: true            },
      { label: 'Agrovet Care',       value: true            },
      { label: 'Tree Analysis',      value: '100 / month'   },
      { label: 'SMS Alerts',         value: false           },
      { label: 'Webhooks',           value: 'Up to 10'      },
      { label: 'Team Seats',         value: '5'             },
    ],
  },
  {
    id: 'scale',
    recommended: false,
    name: 'Scale',
    badge: 'Enterprise',
    price: 'KES 4,500',
    period: 'per month',
    color: '#a78bfa',
    glow: 'rgba(167,139,250,.25)',
    features: [
      { label: 'Forecast Days',      value: '16 days'       },
      { label: 'AI Summary',         value: 'Advanced · SW + EN' },
      { label: 'Crop Diagnosis',     value: true            },
      { label: 'Agrovet Care',       value: true            },
      { label: 'Tree Analysis',      value: 'Unlimited'     },
      { label: 'SMS Alerts',         value: true            },
      { label: 'Webhooks',           value: 'Up to 50'      },
      { label: 'Team Seats',         value: '20'            },
    ],
  },
] as const;

function FeatureValue({ value }: { value: string | boolean }) {
  if (value === true)  return <span style={{ color: '#4ade80', fontSize: 14 }}>✓</span>;
  if (value === false) return <span style={{ color: '#475569', fontSize: 13 }}>—</span>;
  return <span className="text-[11px] font-medium" style={{ color: 'var(--text2)' }}>{value}</span>;
}

function PlansModal({ onClose, onSelectPlan }: { onClose: () => void; onSelectPlan: (plan: PayPlan) => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.7)', backdropFilter: 'blur(6px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="relative w-full max-w-3xl rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg2)', border: '1px solid var(--border)' }}
      >
        {/* Header */}
        <div className="px-6 pt-6 pb-4 text-center">
          <div className="text-[11px] font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--green)' }}>
            ✨ Upgrade FieldCropCast
          </div>
          <h2 className="text-xl font-black" style={{ color: 'var(--text)' }}>
            Pick the plan that fits your farm
          </h2>
          <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
            All plans include real-time weather · Cancel anytime
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid gap-3 px-6 pb-6" style={{ gridTemplateColumns: 'repeat(3, 1fr)' }}>
          {PLANS.map(plan => (
            <div
              key={plan.id}
              className="relative flex flex-col rounded-xl overflow-hidden"
              style={{
                border: plan.recommended ? `1.5px solid ${plan.color}` : '1px solid var(--border)',
                background: plan.recommended ? `linear-gradient(160deg, ${plan.glow}, transparent 60%)` : 'var(--surface)',
                boxShadow: plan.recommended ? `0 0 24px ${plan.glow}` : 'none',
              }}
            >
              {/* Badge */}
              <div className="absolute top-3 right-3">
                <span
                  className="text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-full"
                  style={{ background: plan.glow, color: plan.color, border: `1px solid ${plan.color}44` }}
                >
                  {plan.badge}
                </span>
              </div>

              {/* Plan header */}
              <div className="px-4 pt-4 pb-3">
                <div className="text-base font-black mb-0.5" style={{ color: plan.color }}>{plan.name}</div>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-black" style={{ color: 'var(--text)' }}>{plan.price}</span>
                  <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{plan.period}</span>
                </div>
              </div>

              <div className="h-px mx-4" style={{ background: 'var(--border)' }} />

              {/* Features */}
              <div className="flex flex-col gap-0 px-4 py-3 flex-1">
                {plan.features.map(f => (
                  <div key={f.label} className="flex items-center justify-between py-1.5 gap-2">
                    <span className="text-[10px]" style={{ color: 'var(--muted)' }}>{f.label}</span>
                    <FeatureValue value={f.value} />
                  </div>
                ))}
              </div>

              {/* CTA */}
              <div className="px-4 pb-4 pt-2">
                <button
                  className="w-full py-2 rounded-lg text-xs font-bold transition-all hover:opacity-90"
                  style={{
                    background: plan.recommended ? plan.color : 'var(--border)',
                    color: plan.recommended ? '#000' : 'var(--text2)',
                    border: plan.recommended ? 'none' : '1px solid var(--border)',
                    cursor: plan.id === 'free' ? 'default' : 'pointer',
                    opacity: plan.id === 'free' ? 0.6 : 1,
                  }}
                  onClick={() => {
                    if (plan.id !== 'free') {
                      onSelectPlan({ id: plan.id, name: plan.name, price: plan.price, period: plan.period, color: plan.color });
                    }
                  }}
                  disabled={plan.id === 'free'}
                >
                  {plan.id === 'free' ? 'Current Plan' : `Upgrade to ${plan.name}`}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div
          className="px-6 py-3 text-center text-[10px]"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Payments via M-Pesa Express for All Plans
        </div>

        {/* Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-7 h-7 flex items-center justify-center rounded-full cursor-pointer hover:opacity-70 transition-opacity"
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function AppTopNav({
  theme, onThemeToggle, farmState, weatherData, isRefreshing, isFetching, onRefresh, onResetCache,
}: Props) {
  const { signOut } = useClerk();
  const { user }    = useUser();
  const [plansOpen, setPlansOpen] = useState(false);
  const [payPlan, setPayPlan]     = useState<PayPlan | null>(null);

  const handleSignOut = () => {
    localStorage.removeItem('fc-farm');
    localStorage.removeItem('fc-theme');
    signOut({ redirectUrl: '/sign-in' });
  };

  const daily    = (weatherData?.daily ?? []) as DailyForecast[];
  const cur      = weatherData?.current ?? {};
  const isDay    = isDaytime(daily);

  const risks = daily.length
    ? computeRisks(daily, farmState.crop || 'general', farmState.units)
    : null;

  const worstLevel = risks
    ? ([risks.rain, risks.wind, risks.temp] as const).slice().sort((a, b) => b.score - a.score)[0].level
    : null;

  const pill     = worstLevel ? RISK_PILL[worstLevel] : null;
  const condCode = cur.condition_code ?? 0;
  const tempDisp = cur.temperature != null ? fmtTemp(cur.temperature, farmState.units) : null;

  return (
    <>
      <header
        className="fc-topnav flex items-center gap-4 px-5"
        style={{ background: 'var(--bg2)', borderBottom: '1px solid var(--border)', backdropFilter: 'blur(12px)' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div
            style={{
              width: 32, height: 32, borderRadius: 9,
              background: 'linear-gradient(135deg, #4ade80 0%, #22c55e 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 17, boxShadow: '0 0 16px rgba(74,222,128,.4)',
            }}
          >🌿</div>
          <div>
            <div
              className="font-black text-base tracking-tight leading-none"
              style={{
                background: 'linear-gradient(135deg, var(--green) 0%, #a3e635 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}
            >
              FieldCropCast
            </div>
            <div className="text-[9px] leading-none mt-0.5 font-medium" style={{ color: 'var(--muted)' }}>
              Farm Weather Intelligence
            </div>
          </div>
        </div>

        {/* Center: farm identity + status */}
        <div className="flex-1 flex items-center justify-center gap-3 overflow-hidden min-w-0">
          {(farmState.name || farmState.county) && (
            <div
              className="flex items-center gap-0 rounded-lg overflow-hidden shrink-0"
              style={{ border: '1px solid var(--border)', background: 'var(--surface)' }}
            >
              {farmState.name && (
                <span className="text-xs font-bold px-2.5 py-1" style={{ color: 'var(--text)' }}>
                  {farmState.name}
                </span>
              )}
              {farmState.name && farmState.county && (
                <span className="self-stretch w-px" style={{ background: 'var(--border)' }} />
              )}
              {farmState.county && (
                <span className="flex items-center gap-1 px-2.5 py-1 text-xs" style={{ color: 'var(--muted)' }}>
                  <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ flexShrink: 0 }}>
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                    <circle cx="12" cy="10" r="3"/>
                  </svg>
                  {farmState.county}
                </span>
              )}
            </div>
          )}

          {weatherData && pill && (
            <>
              <span style={{ color: 'var(--border)', flexShrink: 0 }}>·</span>
              <span className={`status-pill ${pill.cls}`}>
                <span className="w-1.5 h-1.5 rounded-full pulse-dot shrink-0" style={{ background: 'currentColor' }} />
                {pill.label}
              </span>
            </>
          )}

          {weatherData && tempDisp && (
            <>
              <span style={{ color: 'var(--border)', flexShrink: 0 }}>·</span>
              <span className="text-sm font-semibold shrink-0" style={{ color: 'var(--text2)' }}>
                {wmoIcon(condCode, isDay)} {tempDisp}
              </span>
            </>
          )}

          {(isFetching || isRefreshing) && (
            <span
              className="flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-full shrink-0"
              style={{ background: 'rgba(74,222,128,.10)', color: 'var(--green)', border: '1px solid rgba(74,222,128,.2)' }}
            >
              <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                style={{ animation: 'spin .7s linear infinite' }}>
                <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
              {isFetching ? 'Fetching…' : 'Updating…'}
            </span>
          )}
        </div>

        {/* Right: controls */}
        <div className="flex items-center gap-2 shrink-0">

          {/* Plan badge */}
          <button
            onClick={() => setPlansOpen(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-all hover:opacity-90 group"
            style={{
              background: 'linear-gradient(135deg, rgba(251,191,36,.12) 0%, rgba(245,158,11,.08) 100%)',
              border: '1px solid rgba(251,191,36,.35)',
              color: '#f59e0b',
            }}
            title="View plans & upgrade"
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M12 2l2.4 7.4H22l-6.2 4.5 2.4 7.4L12 17l-6.2 4.3 2.4-7.4L2 9.4h7.6z"/>
            </svg>
            Free Plan
            <span
              className="text-[9px] font-black px-1.5 py-0.5 rounded"
              style={{ background: '#d97706', color: '#fff', letterSpacing: '0.03em' }}
            >
              Upgrade ↑
            </span>
          </button>

          <button
            onClick={onResetCache}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
            title="Clear all saved farm data and start fresh"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
            Reset Cache
          </button>

          <button
            onClick={onRefresh}
            disabled={isRefreshing || isFetching || !weatherData}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--green)' }}
            title="Refresh weather data now"
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
              style={{ animation: isRefreshing ? 'spin .7s linear infinite' : 'none', flexShrink: 0 }}>
              <path d="M23 4v6h-6" /><path d="M1 20v-6h6" />
              <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
            </svg>
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>

          <button
            onClick={onThemeToggle}
            className="flex items-center justify-center w-8 h-8 rounded-lg cursor-pointer transition-opacity hover:opacity-70"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            <span style={{ fontSize: 14 }}>{theme === 'dark' ? '☀️' : '🌙'}</span>
          </button>

          <button
            onClick={handleSignOut}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all hover:opacity-80"
            style={{ background: 'rgba(239,68,68,.10)', border: '1px solid rgba(239,68,68,.25)', color: '#ef4444' }}
            title={`Sign out${user?.primaryEmailAddress?.emailAddress ? ' · ' + user.primaryEmailAddress.emailAddress : ''}`}
          >
            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
              <polyline points="16 17 21 12 16 7"/>
              <line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
            Sign Out
          </button>
        </div>
      </header>

      {plansOpen && (
        <PlansModal
          onClose={() => setPlansOpen(false)}
          onSelectPlan={plan => { setPlansOpen(false); setPayPlan(plan); }}
        />
      )}

      {payPlan && (
        <PaymentModal plan={payPlan} onClose={() => setPayPlan(null)} />
      )}
    </>
  );
}
