const CONSUMER_KEY    = process.env.MPESA_CONSUMER_KEY    ?? '';
const CONSUMER_SECRET = process.env.MPESA_CONSUMER_SECRET ?? '';
const SHORTCODE       = process.env.MPESA_SHORTCODE       ?? '174379';
const PASSKEY         = process.env.MPESA_PASSKEY         ?? '';

export const MPESA_SHORTCODE = SHORTCODE;

export function getMpesaTimestamp(): string {
  const d = new Date();
  return (
    d.getFullYear().toString() +
    String(d.getMonth() + 1).padStart(2, '0') +
    String(d.getDate()).padStart(2, '0') +
    String(d.getHours()).padStart(2, '0') +
    String(d.getMinutes()).padStart(2, '0') +
    String(d.getSeconds()).padStart(2, '0')
  );
}

export function getMpesaPassword(timestamp: string): string {
  return Buffer.from(`${SHORTCODE}${PASSKEY}${timestamp}`).toString('base64');
}

export async function getDarajaToken(): Promise<string> {
  const creds = Buffer.from(`${CONSUMER_KEY}:${CONSUMER_SECRET}`).toString('base64');
  const res = await fetch(
    'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials',
    { headers: { Authorization: `Basic ${creds}`, Accept: 'application/json' } },
  );
  if (!res.ok) throw new Error(`Daraja auth failed: ${res.status}`);
  const data = await res.json();
  return data.access_token as string;
}

export function formatKenyanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('254')) return digits;
  if (digits.startsWith('0'))   return '254' + digits.slice(1);
  return '254' + digits;
}
