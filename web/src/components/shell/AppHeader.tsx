'use client';

import dynamic from 'next/dynamic';
import { Menu, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/components/ui/button';
import { RequestWithdrawDialogClient } from '@/components/wallet/RequestWithdrawDialogClient';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/components/ui/sheet';
import { SidebarNav } from './SidebarNav';

// Dynamic import para evitar erro de hidratação do Radix UI Dialog
const DepositDialog = dynamic(
  () => import('@/components/wallet/DepositDialog').then((mod) => mod.DepositDialog),
  { ssr: false }
);

type AppHeaderProps = {
  isAuthenticated: boolean;
  userName: string;
  userEmail: string;
  balance: string;
  userId?: string | null;
};

export function AppHeader({
  isAuthenticated,
  userName,
  userEmail,
  balance,
  userId,
}: AppHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSigningOut, startSignOut] = useTransition();

  if (pathname === '/app') {
    return null;
  }

  const handleLogout = () => {
    startSignOut(async () => {
      await signOutAction();
    });
  };

  return (
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-slate-800/60 bg-slate-950/80 px-4 py-3 backdrop-blur-xl lg:py-4 lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="h-12 w-12 min-h-[48px] min-w-[48px] text-slate-400 hover:text-white">
              <Menu className="size-7" />
              <span className="sr-only">Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] border-r-slate-800 bg-slate-950 p-0">
            <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
            <SidebarNav isAuthenticated={isAuthenticated} />
          </SheetContent>
        </Sheet>

        <div>
          <div className="flex items-center gap-2">
            <p className="text-base font-semibold text-slate-50 lg:text-xl">
              {isAuthenticated ? userName : 'Visitante'}
            </p>
            {isAuthenticated && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                disabled={isSigningOut}
                className="h-10 w-10 min-h-[44px] min-w-[44px] text-slate-400 hover:text-rose-400"
                title="Sair"
              >
                <LogOut className="size-5" />
                <span className="sr-only">Sair</span>
              </Button>
            )}
          </div>
          <p className="hidden text-sm text-slate-300 sm:block">
            {isAuthenticated ? userEmail : 'Faça login para liberar a carteira'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-2xl bg-slate-900/70 px-3 py-2 lg:gap-6 lg:px-6 lg:py-4">
        <div className="text-right">
          <span className="hidden text-xs uppercase tracking-[0.28em] text-slate-300 lg:block">
            Saldo virtual
          </span>
          <p className="text-sm font-semibold text-slate-50 lg:text-2xl">{balance}</p>
        </div>
        {isAuthenticated && (
          <div className="flex gap-2">
            <DepositDialog>
              <Button
                variant="default"
                size="sm"
                className="h-12 w-12 min-h-[48px] min-w-[48px] rounded-full p-0 text-2xl font-bold lg:h-auto lg:w-auto lg:px-5 lg:text-base"
              >
                <span className="lg:hidden">+</span>
                <span className="hidden lg:inline">Depositar</span>
              </Button>
            </DepositDialog>
            <RequestWithdrawDialogClient userId={userId} />
          </div>
        )}
      </div>
    </header>
  );
}
