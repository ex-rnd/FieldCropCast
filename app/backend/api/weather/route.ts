import { NextRequest, NextResponse } from 'next/server';

const WAI_BASE = 'https://api.weather-ai.co';

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

  try {
    const response = await fetch(buildUrl('/v1/weather', params), {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data: any = await response.json();
    console.log('[/v1/weather] keys:', Object.keys(data));
    if (data.ai_summary !== undefined) console.log('[weather] ai_summary present');

    const headers = new Headers();
    for (const h of ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset']) {
      const val = response.headers.get(h);
      if (val) headers.set(h, val);
    }
    return NextResponse.json(data, { status: response.status, headers });
  } catch (err: any) {
    console.error('[proxy/weather]', err.message);
    return NextResponse.json({ error: 'WeatherAI request failed', detail: err.message }, { status: 502 });
  }
}
