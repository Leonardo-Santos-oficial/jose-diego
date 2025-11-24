'use client';

import { useAviatorStore } from '@/modules/aviator/state/useAviatorStore';
import { Wallet, LogOut } from 'lucide-react';
import { Button } from '@/components/components/ui/button';
import { DepositDialog } from '@/components/wallet/DepositDialog';
import { RequestWithdrawDialogClient } from '@/components/wallet/RequestWithdrawDialogClient';
import { signOutAction } from '@/app/actions/auth';
import { useTransition } from 'react';
import { AviatorMobileMenu } from './AviatorMobileMenu';

export type AviatorHeaderProps = {
  userId: string;
};

export function AviatorHeader({ userId }: AviatorHeaderProps) {
  const walletSnapshot = useAviatorStore((store) => store.walletSnapshot);
  const [isSigningOut, startSignOut] = useTransition();
  
  const currency = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  });

  const handleLogout = () => {
    startSignOut(async () => {
      await signOutAction();
    });
  };

  return (
    <header className="sticky top-0 z-50 flex h-14 items-center justify-between border-b border-white/10 bg-slate-950/80 px-4 backdrop-blur-md">
      <div className="flex items-center gap-3">
        <AviatorMobileMenu userId={userId} />

        <div className="flex items-center gap-2">
          <span className="text-lg font-bold tracking-tight text-rose-500">AVIATOR</span>
          <span className="rounded bg-rose-500/10 px-1.5 py-0.5 text-[10px] font-bold uppercase text-rose-500">Demo</span>
        </div>
      </div>

      <div className="flex items-center gap-2 lg:gap-4">
        <div className="hidden lg:flex lg:items-center lg:gap-2">
           <DepositDialog>
             <Button
                variant="outline"
                size="sm"
                className="h-8 border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              >
                Depositar
              </Button>
           </DepositDialog>
            <RequestWithdrawDialogClient userId={userId} />
        </div>

        <div className="flex items-center gap-2 rounded-full bg-slate-900 px-3 py-1.5 border border-white/5">
          <Wallet className="h-3.5 w-3.5 text-emerald-400" />
          <div className="flex flex-col leading-none">
             <span className="text-[10px] font-medium text-slate-400">Saldo</span>
             <span className="text-sm font-bold text-white">
               {currency.format(walletSnapshot?.balance ?? 0)}
             </span>
          </div>
        </div>

        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          disabled={isSigningOut}
          className="h-8 w-8 text-slate-400 hover:text-rose-400"
          title="Sair"
        >
          <LogOut className="h-4 w-4" />
          <span className="sr-only">Sair</span>
        </Button>
      </div>
    </header>
  );
}
