import { NextRequest, NextResponse } from 'next/server';
import type { AlertType, AlertSeverity } from '@/lib/types';
import { addAlert } from '@/lib/alerts-store';

const TYPE_MAP: Record<string, AlertType> = {
  heavy_rain:              'heavy_rain',
  'heavy rain':            'heavy_rain',
  'heavy rain warning':    'heavy_rain',
  storm:                   'storm',
  'storm alert':           'storm',
  extreme_heat:            'extreme_heat',
  'extreme heat':          'extreme_heat',
  frost:                   'frost',
  'frost warning':         'frost',
  high_wind:               'high_wind',
  'high wind':             'high_wind',
  'high wind speed':       'high_wind',
};

const SEVERITY_MAP: Record<AlertType, AlertSeverity> = {
  heavy_rain:   'warning',
  storm:        'critical',
  extreme_heat: 'high',
  frost:        'high',
  high_wind:    'warning',
  unknown:      'info',
};

const DEFAULT_MESSAGES: Record<AlertType, string> = {
  heavy_rain:   'Heavy rain warning received from WeatherAI.',
  storm:        'Storm alert received from WeatherAI.',
  extreme_heat: 'Extreme heat alert (38°C+) received from WeatherAI.',
  frost:        'Frost warning received from WeatherAI.',
  high_wind:    'High wind speed alert received from WeatherAI.',
  unknown:      'Weather alert received from WeatherAI.',
};

function inferType(payload: Record<string, unknown>): AlertType {
  for (const key of ['alert_type', 'type', 'condition', 'alert', 'event']) {
    const val = payload[key];
    if (typeof val === 'string') {
      const normalized = val.toLowerCase().trim();
      if (TYPE_MAP[normalized]) return TYPE_MAP[normalized];
    }
  }
  return 'unknown';
}

function inferMessage(payload: Record<string, unknown>, type: AlertType): string {
  for (const key of ['message', 'description', 'detail', 'text', 'body']) {
    const val = payload[key];
    if (typeof val === 'string' && val.trim()) return val.trim();
  }
  return DEFAULT_MESSAGES[type];
}

export async function POST(req: NextRequest) {
  // Optional secret validation
  const secret = process.env.WEBHOOK_SECRET;
  if (secret) {
    const headerSecret = req.headers.get('x-webhook-secret');
    const querySecret  = req.nextUrl.searchParams.get('secret');
    if (headerSecret !== secret && querySecret !== secret) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  let payload: Record<string, unknown>;
  try {
    payload = await req.json();
  } catch {
    payload = {};
  }

  const type    = inferType(payload);
  const severity = SEVERITY_MAP[type];
  const message  = inferMessage(payload, type);
  const alert    = addAlert(type, severity, message, payload);

  console.log(`[webhook/alerts] stored id=${alert.id} type=${type} severity=${severity}`);

  return NextResponse.json({ ok: true, id: alert.id }, { status: 200 });
}
