import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';

const app = express();
const PORT = process.env.PORT || 3000;
const WAI_BASE = 'https://api.weather-ai.co';
const API_KEY = process.env.WAI_API_KEY;

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Helpers

function buildUrl(endpoint: string, params: Record<string, unknown> = {}): string {
  const url = new URL(WAI_BASE + endpoint);
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== null && v !== '') url.searchParams.set(k, String(v));
  }
  return url.toString();
}

async function proxyGet(endpoint: string, params: Record<string, unknown>, res: Response) {
  if (!API_KEY) {
    res.status(500).json({ error: 'WAI_API_KEY is not configured on the server.' });
    return;
  }
  try {
    const response = await fetch(buildUrl(endpoint, params), {
      headers: { Authorization: 'Bearer ' + API_KEY },
    });
    const data: any = await response.json();
    console.log('[' + endpoint + '] keys:', Object.keys(data));
    if (endpoint === '/v1/usage') console.log('[usage] raw:', JSON.stringify(data));
    if (endpoint === '/v1/weather' && data.ai_summary !== undefined) console.log('[weather] ai_summary present');
    if (endpoint === '/v1/weather') {
      const aiKey = Object.keys(data).find(k => k.toLowerCase().includes('ai') || k.toLowerCase().includes('summary'));
      if (aiKey) console.log('[weather] AI field:', aiKey, '->', typeof data[aiKey] === 'string' ? data[aiKey].slice(0, 80) : data[aiKey]);
    }
    for (const h of ['x-ratelimit-limit', 'x-ratelimit-remaining', 'x-ratelimit-reset']) {
      if (response.headers.get(h)) res.setHeader(h, response.headers.get(h)!);
    }
    res.status(response.status).json(data);
  } catch (err: any) {
    console.error('[proxy]', err.message);
    res.status(502).json({ error: 'WeatherAI request failed', detail: err.message });
  }
}

// GET /api/weather?lat=&lon=&days=&units=&ai=
app.get('/api/weather', async (req: Request, res: Response) => {
  const { lat, lon, days = 7, ai = 'true', units = 'metric', lang = 'en' } = req.query;
  if (!lat || !lon) return res.status(400).json({ error: 'lat and lon are required.' });
  await proxyGet('/v1/weather', { lat, lon, days, ai, units, lang }, res);
});

// GET /api/weather-geo?days=&units=&ai=
app.get('/api/weather-geo', async (req: Request, res: Response) => {
  const { days = 7, ai = 'true', units = 'metric' } = req.query;
  const clientIp =
    ((req.headers['x-forwarded-for'] as string) || '').split(',')[0].trim() ||
    req.socket.remoteAddress;
  const ip = clientIp || 'auto';
  await proxyGet('/v1/weather-geo', { ip, days, ai, units }, res);
});

// GET /api/geocode?q=<city name>  (OpenStreetMap Nominatim, no key required)
app.get('/api/geocode', async (req: Request, res: Response) => {
  const { q } = req.query;
  if (!q || !(q as string).trim()) return res.status(400).json({ error: 'q is required.' });
  try {
    const url = 'https://nominatim.openstreetmap.org/search?q=' + encodeURIComponent(q as string) + '&format=json&limit=5&addressdetails=1';
    const response = await fetch(url, {
      headers: { 'User-Agent': 'FieldCast-Dashboard/1.0' },
    });
    const data = await response.json() as any[];
    const results = data.map((r: any) => {
      const addr = r.address || {};
      const label = [addr.city || addr.town || addr.village, addr.country]
        .filter(Boolean)
        .join(', ') || r.display_name.split(',').slice(0, 2).join(',').trim();
      return { name: label, lat: parseFloat(r.lat), lon: parseFloat(r.lon) };
    });
    res.json(results);
  } catch (err: any) {
    console.error('[geocode]', err.message);
    res.status(502).json({ error: 'Geocoding failed', detail: err.message });
  }
});

// GET /api/usage
app.get('/api/usage', async (_req: Request, res: Response) => {
  await proxyGet('/v1/usage', {}, res);
});

// Catch-all SPA
app.get('*', (_req: Request, res: Response) => res.sendFile(path.join(__dirname, 'public', 'index.html')));

app.listen(PORT, () => {
  console.log('');
  console.log('  FieldCast - Farmer Weather Risk Dashboard');
  console.log('  http://localhost:' + PORT);
  console.log('');
  if (!API_KEY) {
    console.warn('  [!] WAI_API_KEY is not set - API requests will fail.');
  }
});
