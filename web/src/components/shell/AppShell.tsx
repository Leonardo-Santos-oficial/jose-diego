import type { ReactNode } from 'react';
import type { User } from '@supabase/supabase-js';
import { getDisplayName } from '@/lib/auth/session';
import { AppHeader } from '@/components/shell/AppHeader';
import { SidebarNav } from '@/components/shell/SidebarNav';

export type AppShellProps = {
  session: User | null;
  children: ReactNode;
  walletBalance?: string;
};

const PLACEHOLDER_BALANCE = 'R$ 0,00';

export function AppShell({ session, children, walletBalance }: AppShellProps) {
  const userEmail = session?.email ?? '';
  const displayName = getDisplayName(session);

  return (
    <div className="flex min-h-screen bg-slate-950">
      {/* Sidebar removed for game focus, or can be kept if needed for other pages */}
      {/* <div className="hidden lg:block">
        <SidebarNav isAuthenticated={Boolean(session)} />
      </div> */}
      <div className="flex flex-1 flex-col">
        <AppHeader
          isAuthenticated={Boolean(session)}
          userName={displayName}
          userEmail={userEmail}
          balance={walletBalance ?? PLACEHOLDER_BALANCE}
          userId={session?.id}
        />
        <main className="flex-1 bg-slate-950">{children}</main>
      </div>
    </div>
  );
}
