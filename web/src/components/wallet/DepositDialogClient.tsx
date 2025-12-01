'use client';

import dynamic from 'next/dynamic';

// Importação dinâmica para evitar erro de hidratação do Radix UI Dialog
const DepositDialog = dynamic(
  () => import('@/components/wallet/DepositDialog').then((mod) => mod.DepositDialog),
  {
    ssr: false,
    loading: () => null,
  }
);

interface DepositDialogClientProps {
  children: React.ReactNode;
}

/**
 * Cliente wrapper para o DepositDialog
 * Usa dynamic import com ssr: false para evitar erro de hidratação do Radix UI
 */
export function DepositDialogClient({ children }: DepositDialogClientProps) {
  return <DepositDialog>{children}</DepositDialog>;
}
