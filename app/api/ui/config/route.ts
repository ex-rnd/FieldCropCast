import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json({
    crops: [
      { value: 'general',   label: 'General / Mixed' },
      { value: 'maize',     label: 'Maize' },
      { value: 'tea',       label: 'Tea' },
      { value: 'coffee',    label: 'Coffee' },
      { value: 'wheat',     label: 'Wheat' },
      { value: 'rice',      label: 'Rice' },
      { value: 'beans',     label: 'Beans' },
      { value: 'tomatoes',  label: 'Tomatoes' },
      { value: 'potatoes',  label: 'Potatoes' },
      { value: 'sugarcane', label: 'Sugarcane' },
      { value: 'flowers',   label: 'Cut Flowers' },
    ],
    units: [
      { value: 'metric',   label: 'Metric (°C, km/h)' },
      { value: 'imperial', label: 'Imperial (°F, mph)' },
    ],
    autoRefreshMs: 300_000,
    forecastDays: 7,
    version: '2.0.0',
  });
}
