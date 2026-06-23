import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const stkCallback = body?.Body?.stkCallback ?? body;
    console.log('[mpesa/callback] received:', JSON.stringify(stkCallback, null, 2));
  } catch {
    console.log('[mpesa/callback] received (non-JSON body)');
  }

  // Safaricom requires this exact response shape
  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}
