import { headers } from 'next/headers';

const LOCAL_FALLBACK = 'http://localhost:3000';

export async function getBaseUrl() {
  const headersList = await headers();
  const forwardedHost = headersList.get('x-forwarded-host');
  const host = forwardedHost ?? headersList.get('host');

  if (!host) {
    if (process.env.NEXT_PUBLIC_APP_URL) {
      return process.env.NEXT_PUBLIC_APP_URL;
    }
    const vercelUrl = process.env.NEXT_PUBLIC_VERCEL_URL || process.env.VERCEL_URL;
    if (vercelUrl) {
      return vercelUrl.startsWith('http') ? vercelUrl : `https://${vercelUrl}`;
    }
    return LOCAL_FALLBACK;
  }

  const protocolHeader = headersList.get('x-forwarded-proto');
  const protocol = protocolHeader ?? (host.startsWith('localhost') ? 'http' : 'https');
  return `${protocol}://${host}`;
}
