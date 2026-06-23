import { NextRequest, NextResponse } from 'next/server';
import { getActiveAlerts, dismissAlert, dismissAll } from '@/lib/alerts-store';

export async function GET() {
  const alerts = getActiveAlerts();
  return NextResponse.json({ alerts });
}

export async function DELETE(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id');
  if (id) {
    const found = dismissAlert(id);
    if (!found) return NextResponse.json({ error: 'Alert not found' }, { status: 404 });
    return NextResponse.json({ ok: true });
  }
  dismissAll();
  return NextResponse.json({ ok: true });
}
