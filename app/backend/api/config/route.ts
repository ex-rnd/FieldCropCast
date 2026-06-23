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
      { value: 'sugarcane',  label: 'Sugarcane' },
      { value: 'flowers',    label: 'Cut Flowers' },
      { value: 'bananas',    label: 'Bananas' },
      { value: 'greengrams', label: 'Green Grams' },
      { value: 'cowpeas',    label: 'Cowpeas' },
      { value: 'sorghum',    label: 'Sorghum' },
      { value: 'cassava',    label: 'Cassava' },
      { value: 'mangoes',    label: 'Mangoes' },
    ],
    units: [
      { value: 'metric',   label: 'Metric (°C, km/h)' },
      { value: 'imperial', label: 'Imperial (°F, mph)' },
    ],
    autoRefreshMs: 1_800_000,
    forecastDays: 7,
    version: '2.0.0',
  });
}
