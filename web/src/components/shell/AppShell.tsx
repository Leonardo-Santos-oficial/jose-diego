import type { ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { getDisplayName } from '@/lib/auth/session';
import { AppHeader } from '@/components/shell/AppHeader';
import { SidebarNav } from '@/components/shell/SidebarNav';

export type AppShellProps = {
  session: Session | null;
  children: ReactNode;
};

const PLACEHOLDER_BALANCE = 'R$ 1.000,00';

export function AppShell({ session, children }: AppShellProps) {
  const userEmail = session?.user.email ?? '';
  const displayName = getDisplayName(session);

  return (
    <div className="flex min-h-screen bg-slate-950">
      <div className="hidden lg:block">
        <SidebarNav isAuthenticated={Boolean(session)} />
      </div>
      <div className="flex flex-1 flex-col">
        <AppHeader
          isAuthenticated={Boolean(session)}
          userName={displayName}
          userEmail={userEmail}
          balance={session ? PLACEHOLDER_BALANCE : '—'}
          userId={session?.user.id}
        />
        <main className="flex-1 bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
