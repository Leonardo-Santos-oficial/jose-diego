'use client';

import { useState, useEffect } from 'react';
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from '@/components/components/ui/sheet';
import { Button } from '@/components/components/ui/button';
import { Menu } from 'lucide-react';
import { SidebarNav } from '@/components/shell/SidebarNav';
import { DepositDialog } from '@/components/wallet/DepositDialog';
import { RequestWithdrawDialogClient } from '@/components/wallet/RequestWithdrawDialogClient';

export function AviatorMobileMenu({ userId }: { userId: string }) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Button variant="ghost" size="icon" className="h-12 w-12 min-h-[48px] min-w-[48px] text-slate-400 hover:text-white">
        <Menu className="h-7 w-7" />
        <span className="sr-only">Menu</span>
      </Button>
    );
  }

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="h-12 w-12 min-h-[48px] min-w-[48px] text-slate-400 hover:text-white">
          <Menu className="h-7 w-7" />
          <span className="sr-only">Menu</span>
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-[300px] border-r-slate-800 bg-slate-950 p-0">
        <SheetTitle className="sr-only">Menu de Navegação</SheetTitle>
        <div className="flex h-full flex-col">
          <div className="flex-1 overflow-y-auto">
            <SidebarNav isAuthenticated={true} />
          </div>
          <div className="border-t border-white/10 bg-slate-900/50 p-4 space-y-3">
            <DepositDialog>
              <Button
                variant="outline"
                className="w-full justify-start border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300"
              >
                <span className="mr-2">+</span> Depositar
              </Button>
            </DepositDialog>
            <div className="w-full [&>button]:w-full">
               <RequestWithdrawDialogClient userId={userId} />
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
