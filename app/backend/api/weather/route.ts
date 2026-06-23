import { NextRequest, NextResponse } from 'next/server';
import { classifyUpstreamError, timeoutError } from '@/lib/api-error';

const WAI_BASE = 'https://api.weather-ai.co';
const FETCH_TIMEOUT_MS = 15_000;

function buildUrl(endpoint: string, params: Record<string, unknown> = {}): string {
  const url = new URL(WAI_BASE + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

export async function GET(req: NextRequest) {
  const API_KEY = process.env.WAI_API_KEY;
  if (!API_KEY) return NextResponse.json({ error: 'WAI_API_KEY is not configured on the server.' }, { status: 500 });

  const sp = req.nextUrl.searchParams;
  const lat = sp.get('lat');
  const lon = sp.get('lon');
  if (!lat || !lon) return NextResponse.json({ error: 'lat and lon are required.' }, { status: 400 });

  const params = {
    lat, lon,
    days:  sp.get('days')  || '7',
    ai:    sp.get('ai')    || 'true',
    units: sp.get('units') || 'metric',
    lang:  sp.get('lang')  || 'sw',
  };

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const response = await fetch(buildUrl('/v1/weather', params), {
      headers: { Authorization: `Bearer ${API_KEY}` },
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data: Record<string, unknown> = await response.json();
    console.log('[/v1/weather] status:', response.status, 'keys:', Object.keys(data));

    if (!response.ok) {
      const classified = classifyUpstreamError(response.status, data);
      console.error('[proxy/weather]', classified.code, classified.detail);
      return NextResponse.json(classified, { status: response.status === 429 ? 429 : response.status === 401 || response.status === 403 ? 401 : 502 });
    }

    if (data.ai_summary !== undefined) console.log('[weather] ai_summary present');
    const headers = new Headers();
    for (const h of ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset']) {
      const val = response.headers.get(h);
      if (val) headers.set(h, val);
    }
    return NextResponse.json(data, { status: 200, headers });
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const classified = isTimeout ? timeoutError() : { code: 'UPSTREAM_ERROR' as const, error: 'WeatherAI request failed.', detail: err instanceof Error ? err.message : String(err) };
    console.error('[proxy/weather]', classified.code, classified.detail);
    return NextResponse.json(classified, { status: isTimeout ? 504 : 502 });
  }
}
