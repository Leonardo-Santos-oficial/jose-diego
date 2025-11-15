import type { Metadata } from 'next';
import './globals.css';
import { AppShell } from '@/components/shell/AppShell';
import { getCurrentSession } from '@/lib/auth/session';

export const dynamic = 'force-dynamic';
export const fetchCache = 'force-no-store';

export const metadata: Metadata = {
  title: 'Aviator Demo Platform',
  description: 'Plataforma de apostas demo seguindo o PRD v1.2',
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
