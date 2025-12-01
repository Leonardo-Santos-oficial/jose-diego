import { type ReactElement } from 'react';
import { ShieldCheck } from 'lucide-react';
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
  gameState,
}: AviatorHudProps): ReactElement {
  return (
    <div className="flex flex-col items-end gap-2">
      {/* Connection Status */}
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

      {/* Provably Fair Hash (Visible when available) */}
      {gameState?.hash && (
        <div 
          className="flex items-center gap-1.5 rounded-full bg-black/40 px-3 py-1 backdrop-blur-md border border-white/10 cursor-help group transition-colors hover:bg-black/60"
          title={`Hash da Rodada: ${gameState.hash}`}
        >
          <ShieldCheck className="w-3 h-3 text-emerald-400" />
          <span className="text-[10px] font-medium text-emerald-400/80 group-hover:text-emerald-400">
            Provably Fair
          </span>
          <span className="hidden group-hover:block text-xs text-white/50 font-mono ml-1 max-w-[100px] truncate md:text-[10px]">
            {gameState.hash.substring(0, 8)}...
          </span>
        </div>
      )}
    </div>
  );
}

