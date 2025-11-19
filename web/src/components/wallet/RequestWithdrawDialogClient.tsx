'use client';

import { useEffect, useState } from 'react';
import { Button } from '@/components/components/ui/button';
import { RequestWithdrawDialog } from '@/components/wallet/RequestWithdrawDialog';

type RequestWithdrawDialogClientProps = {
  userId?: string | null;
};

/**
 * Evita hydration mismatch renderizando o diálogo apenas após o mounted no cliente.
 */
export function RequestWithdrawDialogClient({
  userId,
}: RequestWithdrawDialogClientProps) {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- safe flip after hydration
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return (
      <Button
        type="button"
        variant="secondary"
        className="rounded-full border border-slate-700 px-5"
        disabled
      >
        Solicitar Saque
      </Button>
    );
  }

  return <RequestWithdrawDialog userId={userId} />;
}
