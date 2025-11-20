import { type ReactElement } from 'react';
import type {
  BetResultMessage,
  CashoutResultMessage,
  GameStateMessage,
  WalletSnapshot,
} from '@/types/aviator';

export type AviatorHudProps = {
  isConnected: boolean;
  gameState?: GameStateMessage;
  walletSnapshot?: WalletSnapshot;
  betResult?: BetResultMessage;
  cashoutResult?: CashoutResultMessage;
};

export function AviatorHud({
  isConnected,
}: AviatorHudProps): ReactElement {
  return (
    <div className="flex items-center gap-2 rounded-full bg-black/40 px-3 py-1 backdrop-blur-md border border-white/10">
      <div
        className={`h-2 w-2 rounded-full ${
          isConnected ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]' : 'bg-rose-500'
        }`}
      />
      <span className="text-xs font-medium text-white/80">
        {isConnected ? 'Conectado' : 'Desconectado'}
      </span>
    </div>
  );
}

