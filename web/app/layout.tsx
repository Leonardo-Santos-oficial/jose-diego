import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/shell/AppShell';
import { getCurrentSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://aviator-demo.example.com';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: 'Aviator Demo Platform',
    template: '%s · Aviator Demo Platform',
  },
  description:
    'Landing page demo do Aviator com autenticação Supabase, hero em vídeo e checklist de performance.',
  keywords: ['aviator', 'demo', 'supabase', 'next.js', 'crash game', 'landing page'],
  openGraph: {
    title: 'Aviator Demo Platform',
    description:
      'Experiência demo completa com hero em vídeo, chat realtime e checklist Lighthouse.',
    url: siteUrl,
    siteName: 'Aviator Demo Platform',
    images: [
      {
        url: '/aviator/images/img_bg.png',
        width: 1200,
        height: 630,
        alt: 'Interface Aviator Demo',
      },
    ],
    locale: 'pt_BR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Aviator Demo Platform',
    description:
      'Landing de demonstração com CTA integrado, vídeo hero e testes Lighthouse automatizados.',
    images: ['/aviator/images/img_bg.png'],
  },
  alternates: {
    canonical: '/',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getCurrentSession();

  return (
    <html lang="pt-BR" className="dark">
      <body>
        <AppShell session={session}>{children}</AppShell>
      </body>
    </html>
  );
}
