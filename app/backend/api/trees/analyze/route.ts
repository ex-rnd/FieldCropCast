import { NextRequest, NextResponse } from 'next/server';

const WAI_BASE = 'https://api.weather-ai.co';

export async function POST(request: NextRequest) {
  const API_KEY = process.env.WAI_API_KEY;
  if (!API_KEY) return NextResponse.json({ error: 'WAI_API_KEY not configured.' }, { status: 500 });

  try {
    const formData = await request.formData();
    const res = await fetch(`${WAI_BASE}/v1/trees/analyze`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${API_KEY}` },
      body: formData,
    });
    const data = await res.json();
    return NextResponse.json(data, { status: res.status });
  } catch (err: any) {
    return NextResponse.json({ error: 'WeatherAI request failed', detail: err.message }, { status: 502 });
  }
}
