import { NextRequest, NextResponse } from 'next/server';
import {
  getDarajaToken,
  getMpesaTimestamp,
  getMpesaPassword,
  formatKenyanPhone,
  MPESA_SHORTCODE,
} from '@/lib/mpesa';

export async function POST(req: NextRequest) {
  let body: Record<string, unknown>;
  try { body = await req.json(); } catch { body = {}; }

  const { phoneNumber, amount, planId } = body as {
    phoneNumber?: string;
    amount?: number;
    planId?: string;
  };

  if (!phoneNumber || !amount || !planId) {
    return NextResponse.json({ error: 'phoneNumber, amount, and planId are required.' }, { status: 400 });
  }

  const callbackUrl = process.env.MPESA_CALLBACK_URL;
  if (!callbackUrl || callbackUrl.includes('your-ngrok-url')) {
    return NextResponse.json(
      { error: 'MPESA_CALLBACK_URL is not configured. Set it to your public URL in .env.' },
      { status: 500 },
    );
  }

  try {
    const token     = await getDarajaToken();
    const timestamp = getMpesaTimestamp();
    const password  = getMpesaPassword(timestamp);
    const phone     = formatKenyanPhone(phoneNumber);

    const payload = {
      BusinessShortCode: MPESA_SHORTCODE,
      Password:          password,
      Timestamp:         timestamp,
      TransactionType:   'CustomerPayBillOnline',
      Amount:            String(amount),
      PartyA:            phone,
      PartyB:            MPESA_SHORTCODE,
      PhoneNumber:       phone,
      CallBackURL:       callbackUrl,
      AccountReference:  `FieldCropCast-${planId}`,
      TransactionDesc:   `FieldCropCast ${planId} plan`,
    };

    const res = await fetch(
      'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest',
      {
        method:  'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body:    JSON.stringify(payload),
      },
    );

    const data = await res.json();
    console.log('[mpesa/stk-push]', data);

    return NextResponse.json({
      CheckoutRequestID:  data.CheckoutRequestID,
      ResponseCode:       data.ResponseCode,
      CustomerMessage:    data.CustomerMessage,
      ResponseDescription: data.ResponseDescription,
    }, { status: res.ok ? 200 : 502 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error('[mpesa/stk-push]', msg);
    return NextResponse.json({ error: 'STK push failed', detail: msg }, { status: 502 });
  }
}
