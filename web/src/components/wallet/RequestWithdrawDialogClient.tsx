'use client';

import dynamic from 'next/dynamic';
import { Button } from '@/components/components/ui/button';

// Importação dinâmica para evitar erro de hidratação do Radix UI Dialog
const RequestWithdrawDialog = dynamic(
  () => import('@/components/wallet/RequestWithdrawDialog').then((mod) => mod.RequestWithdrawDialog),
  {
    ssr: false,
    loading: () => (
      <Button
        type="button"
        variant="secondary"
        className="h-11 min-h-[44px] rounded-full border border-slate-700 px-3 text-sm lg:px-5"
        disabled
      >
        <span className="lg:hidden">Saque</span>
        <span className="hidden lg:inline">Solicitar Saque</span>
      </Button>
    ),
  }
);

type RequestWithdrawDialogClientProps = {
  userId?: string | null;
};

/**
 * Cliente wrapper para o RequestWithdrawDialog
 * Usa dynamic import com ssr: false para evitar erro de hidratação do Radix UI
 */
export function RequestWithdrawDialogClient({
  userId,
}: RequestWithdrawDialogClientProps) {
  return <RequestWithdrawDialog userId={userId} />;
}
