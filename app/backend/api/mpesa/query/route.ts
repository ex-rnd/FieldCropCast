import { NextRequest, NextResponse } from 'next/server';
import {
  getDarajaToken,
  getMpesaTimestamp,
  getMpesaPassword,
  MPESA_SHORTCODE,
} from '@/lib/mpesa';

export async function GET(req: NextRequest) {
  const checkoutId = req.nextUrl.searchParams.get('checkoutId');
  if (!checkoutId) {
    return NextResponse.json({ error: 'checkoutId query param is required.' }, { status: 400 });
  }

  try {
    const token     = await getDarajaToken();
    const timestamp = getMpesaTimestamp();
    const password  = getMpesaPassword(timestamp);

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      CheckoutRequestID: checkoutId,
    };

    const res = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query',
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      },
    );

    const data = await res.json();
    console.log('[mpesa/query]', checkoutId, data.ResultCode, data.ResultDesc);

    return NextResponse.json({
      ResultCode: data.ResultCode ?? null,
      ResultDesc: data.ResultDesc ?? data.errorMessage ?? 'Pending',
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[mpesa/query]', msg);
    return NextResponse.json({ error: 'Query failed', detail: msg }, { status: 502 });
  }
}
