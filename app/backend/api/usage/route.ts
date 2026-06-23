import { NextResponse } from 'next/server';

const WAI_BASE = 'https://api.weather-ai.co';

export async function GET() {
  const API_KEY = process.env.WAI_API_KEY;
  if (!API_KEY) return NextResponse.json({ error: 'WAI_API_KEY is not configured on the server.' }, { status: 500 });

  try {
    const response = await fetch(`${WAI_BASE}/v1/usage`, {
      headers: { Authorization: `Bearer ${API_KEY}` },
    });
    const data: any = await response.json();
    console.log('[usage] raw:', JSON.stringify(data));
    return NextResponse.json(data, { status: response.status });
  } catch (err: any) {
    console.error('[proxy/usage]', err.message);
    return NextResponse.json({ error: 'WeatherAI request failed', detail: err.message }, { status: 502 });
  }
}
