import { fileURLToPath } from 'url';
import path from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Domínios permitidos (adicione novos domínios aqui ou via ALLOWED_DOMAINS env var)
const allowedDomains = process.env.ALLOWED_DOMAINS 
  ? process.env.ALLOWED_DOMAINS.split(',').map(d => d.trim())
  : [
      'gradbellagio.bet',
      'grandbellagio.io',
      'grandbellagio.gg',
      'grandbellagio.com.br',
      'grandbellagio.online',
      'jose-diego.vercel.app'
    ];

const domainsForCSP = allowedDomains.map(d => `https://${d} https://www.${d}`).join(' ');

const ContentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://vercel.live https://*.vercel.app ${domainsForCSP}`,
  "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  `img-src 'self' data: blob: https://*.supabase.co ${domainsForCSP}`,
  "font-src 'self' https://fonts.gstatic.com data:",
  "connect-src 'self' https://*.supabase.co wss://*.supabase.co https://vercel.live https://engine.grandbellagio.gg wss://engine.grandbellagio.gg",
  "frame-ancestors 'self'",
  "form-action 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "media-src 'self'",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "upgrade-insecure-requests",
].join('; ');

const securityHeaders = [
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
  { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
  { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  { 
    key: 'Permissions-Policy', 
    value: 'accelerometer=(), camera=(), geolocation=(), gyroscope=(), magnetometer=(), microphone=(), payment=(self), usb=()' 
  },
  { key: 'Content-Security-Policy', value: ContentSecurityPolicy },
];

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    serverActions: {},
  },
  turbopack: {
    root: __dirname,
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
      {
        source: '/robots.txt',
        headers: securityHeaders,
      },
      {
        source: '/favicon.ico',
        headers: securityHeaders,
      },
      {
        source: '/_next/static/:path*',
        headers: [
          ...securityHeaders,
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
      {
        source: '/aviator/:path*',
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;
