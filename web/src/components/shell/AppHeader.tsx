'use client';

import { Menu, LogOut } from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useTransition } from 'react';
import { signOutAction } from '@/app/actions/auth';
import { Button } from '@/components/components/ui/button';
import { RequestWithdrawDialogClient } from '@/components/wallet/RequestWithdrawDialogClient';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/components/ui/sheet';
import { SidebarNav } from './SidebarNav';

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
    <header className="sticky top-0 z-50 flex items-center justify-between gap-4 border-b border-slate-800/60 bg-slate-950/80 px-4 py-4 backdrop-blur-xl lg:px-6">
      <div className="flex items-center gap-4">
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
              <Menu className="size-6" />
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
                className="h-6 w-6 text-slate-400 hover:text-rose-400"
                title="Sair"
              >
                <LogOut className="size-4" />
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
            <Button
              variant="default"
              size="sm"
              className="h-8 w-8 rounded-full p-0 lg:h-auto lg:w-auto lg:px-5"
              onClick={() =>
                alert(
                  'Para realizar um depósito simulado, entre em contato com o suporte através do chat no canto inferior direito.'
                )
              }
            >
              <span className="lg:hidden">+</span>
              <span className="hidden lg:inline">Depositar</span>
            </Button>
            <RequestWithdrawDialogClient userId={userId} />
          </div>
        )}
      </div>
    </header>
  );
}
