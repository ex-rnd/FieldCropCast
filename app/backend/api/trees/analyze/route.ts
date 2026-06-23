import { NextRequest, NextResponse } from 'next/server';
import { classifyUpstreamError, timeoutError } from '@/lib/api-error';

const WAI_BASE = 'https://api.weather-ai.co';
const FETCH_TIMEOUT_MS = 30_000; // image upload can be slower

export async function POST(request: NextRequest) {
  const API_KEY = process.env.WAI_API_KEY;
  if (!API_KEY) return NextResponse.json({ error: 'WAI_API_KEY not configured.' }, { status: 500 });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);

  try {
    const formData = await request.formData();
    const res = await fetch(`${WAI_BASE}/v1/trees/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: formData,
      signal: controller.signal,
    });
    clearTimeout(timer);

    const data: Record<string, unknown> = await res.json();

    if (!res.ok) {
      const classified = classifyUpstreamError(res.status, data);
      console.error('[proxy/trees/analyze]', classified.code, classified.detail);
      return NextResponse.json(classified, { status: res.status === 429 ? 429 : res.status === 401 || res.status === 403 ? 401 : 502 });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (err: unknown) {
    clearTimeout(timer);
    const isTimeout = err instanceof Error && err.name === 'AbortError';
    const classified = isTimeout ? timeoutError() : { code: 'UPSTREAM_ERROR' as const, error: 'WeatherAI request failed.', detail: err instanceof Error ? err.message : String(err) };
    console.error('[proxy/trees/analyze]', classified.code, classified.detail);
    return NextResponse.json(classified, { status: isTimeout ? 504 : 502 });
  }
}
