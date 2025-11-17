import { create } from 'zustand';
import type {
  BetResultMessage,
  CashoutResultMessage,
  GameHistoryEntry,
  GameStateMessage,
  WalletSnapshot,
} from '@/types/aviator';

export type AviatorStore = {
  state?: GameStateMessage;
  history: GameHistoryEntry[];
  betResult?: BetResultMessage;
  cashoutResult?: CashoutResultMessage;
  walletSnapshot?: WalletSnapshot;
  musicEnabled: boolean;
  isConnected: boolean;
  setState: (payload: GameStateMessage) => void;
  setHistory: (entries: GameHistoryEntry[]) => void;
  setBetResult: (result: BetResultMessage) => void;
  setCashoutResult: (result: CashoutResultMessage) => void;
  syncWalletSnapshot: (snapshot: WalletSnapshot) => void;
  setMusicEnabled: (enabled: boolean) => void;
  setConnected: (connected: boolean) => void;
};

const shouldReplaceWallet = (current?: WalletSnapshot, incoming?: WalletSnapshot) => {
  if (!incoming) {
    return false;
  }

  if (!current) {
    return true;
  }

  return new Date(incoming.updatedAt).getTime() >= new Date(current.updatedAt).getTime();
};

export const useAviatorStore = create<AviatorStore>((set) => ({
  history: [],
  musicEnabled: false,
  isConnected: false,
  setState: (payload) => set({ state: payload }),
  setHistory: (entries) => set({ history: entries }),
  setBetResult: (result) =>
    set((current) => ({
      betResult: result,
      walletSnapshot: shouldReplaceWallet(current.walletSnapshot, result.snapshot)
        ? result.snapshot
        : current.walletSnapshot,
    })),
  setCashoutResult: (result) =>
    set((current) => ({
      cashoutResult: result,
      walletSnapshot: shouldReplaceWallet(current.walletSnapshot, result.snapshot)
        ? result.snapshot
        : current.walletSnapshot,
    })),
  syncWalletSnapshot: (snapshot) =>
    set((current) => ({
      walletSnapshot: shouldReplaceWallet(current.walletSnapshot, snapshot)
        ? snapshot
        : current.walletSnapshot,
    })),
  setMusicEnabled: (enabled) => set({ musicEnabled: enabled }),
  setConnected: (connected) => set({ isConnected: connected }),
}));

declare global {
  interface Window {
    __aviatorStore?: typeof useAviatorStore;
  }
}

if (typeof window !== 'undefined') {
  window.__aviatorStore = useAviatorStore;
}
