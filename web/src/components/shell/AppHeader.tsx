import { Button } from '@/components/components/ui/button';
import { RequestWithdrawDialog } from '@/components/wallet/RequestWithdrawDialog';

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
  return (
    <header className="flex flex-wrap items-center justify-between gap-6 border-b border-slate-800/60 px-6 py-6">
      <div>
        <p className="text-xl font-semibold text-slate-50">
          {isAuthenticated ? userName : 'Visitante'}
        </p>
        <p className="text-sm text-slate-400">
          {isAuthenticated ? userEmail : 'Faça login para liberar a carteira'}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-6 rounded-2xl bg-slate-900/70 px-6 py-4">
        <div>
          <span className="text-xs uppercase tracking-[0.28em] text-slate-400">
            Saldo virtual
          </span>
          <p className="text-2xl font-semibold text-slate-50">{balance}</p>
        </div>
        <div className="flex gap-3">
          <Button variant="default" className="rounded-full px-5">
            Depositar
          </Button>
          <RequestWithdrawDialog userId={isAuthenticated ? userId : undefined} />
        </div>
      </div>
    </header>
  );
}
