import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  const q = req.nextUrl.searchParams.get('q');
  if (!q || !q.trim()) return NextResponse.json({ error: 'q is required.' }, { status: 400 });

  try {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q) + '&format=json&limit=5&addressdetails=1';
    const response = await fetch(url, { headers: { 'User-Agent': 'FieldCast-Dashboard/1.0' } });
    const data = await response.json() as any[];
    const results = data.map((r: any) => {
      const addr = r.address || {};
      const label = [addr.city || addr.town || addr.village, addr.country]
        .filter(Boolean).join(', ') || r.display_name.split(',').slice(0, 2).join(',').trim();
      return { name: label, lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
    });
    return NextResponse.json(results);
  } catch (err: any) {
    console.error('[geocode]', err.message);
    return NextResponse.json({ error: 'Geocoding failed', detail: err.message }, { status: 502 });
  }
}
