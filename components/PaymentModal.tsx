'use client';

import { useState, useEffect, useRef } from 'react';

export interface PayPlan {
  id: string;
  name: string;
  price: string;
  period: string;
  color: string;
}

interface Props {
  plan: PayPlan;
  onClose: () => void;
}

type PayState = 'idle' | 'submitting' | 'pending' | 'success' | 'failed';

const PLAN_AMOUNTS: Record<string, number> = {
  pro:   1200,
  scale: 4500,
};

const POLL_INTERVAL_MS = 8_000;
const POLL_TIMEOUT_MS  = 90_000;

export default function PaymentModal({ plan, onClose }: Props) {
  const [phone, setPhone]         = useState('');
  const [state, setState]         = useState<PayState>('idle');
  const [message, setMessage]     = useState('');
  const [checkoutId, setCheckoutId] = useState('');
  const pollRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const amount = PLAN_AMOUNTS[plan.id] ?? 0;

  const clearPolling = () => {
    if (pollRef.current)  { clearInterval(pollRef.current);  pollRef.current  = null; }
    if (timerRef.current) { clearTimeout(timerRef.current);  timerRef.current = null; }
  };

  useEffect(() => () => clearPolling(), []);

  const startPolling = (id: string) => {
    clearPolling();

    pollRef.current = setInterval(async () => {
      try {
        const res  = await fetch(`/backend/api/mpesa/query?checkoutId=${id}`);
        const data = await res.json();
        const code = data.ResultCode;

        if (code === '0' || code === 0) {
          clearPolling();
          setState('success');
          setMessage('Payment received — your plan is now active!');
        } else if (code !== null && code !== undefined) {
          clearPolling();
          setState('failed');
          setMessage(data.ResultDesc ?? 'Payment was not completed. Please try again.');
        }
      } catch {
        // network hiccup — keep polling
      }
    }, POLL_INTERVAL_MS);

    timerRef.current = setTimeout(() => {
      clearPolling();
      setState('failed');
      setMessage('Payment timed out. Please check your M-Pesa messages and try again.');
    }, POLL_TIMEOUT_MS);
  };

  const handlePay = async () => {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 9) {
      setMessage('Enter a valid Kenyan phone number.');
      return;
    }

    setState('submitting');
    setMessage('');

    try {
      const res = await fetch('/backend/api/mpesa/stk-push', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify({ phoneNumber: phone, amount, planId: plan.id }),
      });
      const data = await res.json();

      if (!res.ok || data.error) {
        setState('failed');
        setMessage(data.error ?? 'Failed to initiate payment. Please try again.');
        return;
      }

      if (data.ResponseCode === '0' || data.ResponseCode === 0) {
        setCheckoutId(data.CheckoutRequestID ?? '');
        setState('pending');
        setMessage(data.CustomerMessage ?? 'Check your phone and enter your M-Pesa PIN.');
        startPolling(data.CheckoutRequestID ?? '');
      } else {
        setState('failed');
        setMessage(data.ResponseDescription ?? 'STK push was rejected. Please try again.');
      }
    } catch {
      setState('failed');
      setMessage('Network error. Please check your connection and try again.');
    }
  };

  const handleClose = () => {
    clearPolling();
    onClose();
  };

  const handleRetry = () => {
    clearPolling();
    setState('idle');
    setMessage('');
    setCheckoutId('');
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center p-4"
      style={{ background: 'rgba(0,0,0,.75)', backdropFilter: 'blur(8px)' }}
      onClick={e => e.target === e.currentTarget && handleClose()}
    >
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg2)', border: `1.5px solid ${plan.color}44` }}
      >
        {/* Header */}
        <div
          className="px-5 pt-5 pb-4 flex items-center gap-3"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          {/* M-Pesa logo */}
          <img
            src="/mpesa-logo.png"
            alt="M-Pesa"
            style={{ height: 28, objectFit: 'contain' }}
            onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-black" style={{ color: plan.color }}>
              Upgrade to {plan.name}
            </div>
            <div className="text-[10px]" style={{ color: 'var(--muted)' }}>
              {plan.price} <span style={{ opacity: .6 }}>/ {plan.period}</span>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 flex items-center justify-center rounded-full cursor-pointer hover:opacity-70 transition-opacity shrink-0"
            style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--muted)' }}
          >
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-5 flex flex-col gap-4">

          {/* ── Idle / Submitting ── */}
          {(state === 'idle' || state === 'submitting') && (
            <>
              <div>
                <label className="text-[10px] font-bold uppercase tracking-wider mb-1.5 block" style={{ color: 'var(--muted)' }}>
                  M-Pesa Phone Number
                </label>
                <div
                  className="flex items-center gap-0 rounded-lg overflow-hidden"
                  style={{ border: '1.5px solid var(--border)', background: 'var(--surface)' }}
                >
                  <span
                    className="text-xs font-bold px-3 py-2.5 shrink-0"
                    style={{ color: 'var(--muted)', borderRight: '1px solid var(--border)' }}
                  >
                    +254
                  </span>
                  <input
                    type="tel"
                    placeholder="7XX XXX XXX"
                    value={phone}
                    onChange={e => { setPhone(e.target.value); setMessage(''); }}
                    disabled={state === 'submitting'}
                    className="flex-1 text-sm px-3 py-2.5 bg-transparent outline-none"
                    style={{ color: 'var(--text)' }}
                    maxLength={12}
                    onKeyDown={e => e.key === 'Enter' && state === 'idle' && handlePay()}
                  />
                </div>
              </div>

              {message && (
                <p className="text-[11px] text-center" style={{ color: '#ef4444' }}>{message}</p>
              )}

              <button
                onClick={handlePay}
                disabled={state === 'submitting'}
                className="w-full py-3 rounded-xl text-sm font-black cursor-pointer transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: `linear-gradient(135deg, #00a651 0%, #007a3d 100%)`,
                  color: '#fff',
                  boxShadow: '0 4px 16px rgba(0,166,81,.3)',
                }}
              >
                {state === 'submitting' ? 'Sending request…' : `Pay ${plan.price} via M-Pesa`}
              </button>

              <p className="text-[10px] text-center" style={{ color: 'var(--muted)' }}>
                An STK Push will be sent to your phone. Enter your PIN to confirm.
              </p>
            </>
          )}

          {/* ── Pending ── */}
          {state === 'pending' && (
            <div className="flex flex-col items-center gap-4 py-4">
              <img
                src="/mpesa-loading.gif"
                alt="Processing…"
                style={{ height: 40, objectFit: 'contain' }}
                onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
              />
              {/* Fallback animated dots if gif not found */}
              <div className="flex gap-1.5">
                {[0, 1, 2].map(i => (
                  <span
                    key={i}
                    style={{
                      width: 8, height: 8, borderRadius: '50%',
                      background: '#00a651',
                      display: 'inline-block',
                      animation: `pulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                    }}
                  />
                ))}
              </div>
              <div className="text-center">
                <p className="text-sm font-bold mb-1" style={{ color: 'var(--text)' }}>Check your phone</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>
                  {message || 'Enter your M-Pesa PIN to complete payment.'}
                </p>
              </div>
              <button
                onClick={handleRetry}
                className="text-[10px] underline cursor-pointer"
                style={{ background: 'none', border: 'none', color: 'var(--muted)' }}
              >
                Cancel
              </button>
            </div>
          )}

          {/* ── Success ── */}
          {state === 'success' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'rgba(0,166,81,.15)', border: '2px solid #00a651' }}
              >
                ✓
              </div>
              <div>
                <p className="text-base font-black mb-1" style={{ color: '#4ade80' }}>Payment Received!</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{message}</p>
              </div>
              <button
                onClick={handleClose}
                className="w-full py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:opacity-90"
                style={{ background: 'rgba(74,222,128,.15)', border: '1px solid #4ade80', color: '#4ade80' }}
              >
                Done
              </button>
            </div>
          )}

          {/* ── Failed ── */}
          {state === 'failed' && (
            <div className="flex flex-col items-center gap-4 py-4 text-center">
              <div
                className="w-14 h-14 rounded-full flex items-center justify-center text-2xl"
                style={{ background: 'rgba(239,68,68,.12)', border: '2px solid rgba(239,68,68,.4)' }}
              >
                ✕
              </div>
              <div>
                <p className="text-base font-black mb-1" style={{ color: '#ef4444' }}>Payment Failed</p>
                <p className="text-[11px]" style={{ color: 'var(--muted)' }}>{message}</p>
              </div>
              <div className="flex gap-2 w-full">
                <button
                  onClick={handleRetry}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:opacity-90"
                  style={{ background: `linear-gradient(135deg, #00a651 0%, #007a3d 100%)`, color: '#fff' }}
                >
                  Try Again
                </button>
                <button
                  onClick={handleClose}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold cursor-pointer transition-all hover:opacity-70"
                  style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text2)' }}
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="px-5 py-3 text-center text-[10px]"
          style={{ borderTop: '1px solid var(--border)', color: 'var(--muted)' }}
        >
          Secured by M-Pesa Express · Payments via Safaricom
        </div>
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: .3; transform: scale(.8); }
          50%       { opacity: 1;  transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
