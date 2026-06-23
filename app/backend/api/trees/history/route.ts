import { NextResponse } from 'next/server';

const WAI_BASE = 'https://api.weather-ai.co';

export async function GET() {
  const API_KEY = process.env.WAI_API_KEY;
  if (!API_KEY) return NextResponse.json({ error: 'WAI_API_KEY not configured.' }, { status: 500 });

  try {
    const res  = await fetch(`${WAI_BASE}/v1/trees/history`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: 'WeatherAI request failed', detail: err.message }, { status: 502 });
  }
}
