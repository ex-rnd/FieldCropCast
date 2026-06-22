import { randomUUID } from 'crypto';
import type { WeatherAlert, AlertType, AlertSeverity } from './types';

const MAX_ALERTS = 50;
const TTL_MS = 24 * 60 * 60 * 1000; // 24 hours

// Module-level singleton — survives across requests in the same Node.js process.
// NOTE: resets on cold starts in serverless environments (Vercel, Lambda).
const store: WeatherAlert[] = [];

export function addAlert(
  type: AlertType,
  severity: AlertSeverity,
  message: string,
  raw: unknown,
): WeatherAlert {
  purgeExpired();

  const now = new Date();
  const alert: WeatherAlert = {
    id: randomUUID(),
    type,
    severity,
    message,
    receivedAt: now.toISOString(),
    expiresAt: new Date(now.getTime() + TTL_MS).toISOString(),
    raw,
  };

  store.unshift(alert);                        // newest first
  if (store.length > MAX_ALERTS) store.splice(MAX_ALERTS);

  return alert;
}

export function getActiveAlerts(): WeatherAlert[] {
  purgeExpired();
  return [...store];
}

export function dismissAlert(id: string): boolean {
  const idx = store.findIndex(a => a.id === id);
  if (idx === -1) return false;
  store.splice(idx, 1);
  return true;
}

export function dismissAll(): void {
  store.splice(0, store.length);
}

function purgeExpired(): void {
  const now = Date.now();
  for (let i = store.length - 1; i >= 0; i--) {
    if (new Date(store[i].expiresAt).getTime() < now) store.splice(i, 1);
  }
}
