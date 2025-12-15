import { AviatorRealtimeClient } from '@/lib/realtime/aviatorClient';
import type {
  BetResultMessage,
  CashoutResultMessage,
  GameHistoryMessage,
  GameStateMessage,
  WalletSnapshot,
} from '@/types/aviator';
import { AviatorAudioEngine } from '@/modules/aviator/audio/aviatorAudioEngine';
import { useAviatorStore } from '@/modules/aviator/state/useAviatorStore';

export class AviatorController {
  private readonly client: AviatorRealtimeClient;
  private readonly audio: AviatorAudioEngine;
  private readonly userId: string;
  private readonly engineAccessToken: string | null;
  private static readonly MUSIC_STORAGE_KEY = 'aviator:music-enabled';
  private static readonly CLIENT_TICK_INTERVAL_MS = 750;
  private static readonly ENABLE_CLIENT_TICK =
    process.env.NEXT_PUBLIC_AVIATOR_ENABLE_CLIENT_TICK !== '0';
  private tickTimer?: number;

  constructor(
    userId: string,
    engineAccessToken: string | null,
    client: AviatorRealtimeClient = new AviatorRealtimeClient(),
    audio: AviatorAudioEngine = new AviatorAudioEngine()
  ) {
    this.client = client;
    this.audio = audio;
    this.userId = userId;
    this.engineAccessToken = engineAccessToken;
  }

  connect(): () => void {
    useAviatorStore.getState().setConnected(false);

    this.client.subscribe(
      {
        onState: (payload) => this.handleState(payload),
        onHistory: (payload) => this.handleHistory(payload),
        onBetResult: (payload) => this.handleBetResult(payload),
        onCashoutResult: (payload) => this.handleCashoutResult(payload),
        onWalletSnapshot: (payload: WalletSnapshot) => this.handleWalletSnapshot(payload),
      },
      { userId: this.userId, engineAccessToken: this.engineAccessToken }
    );

    this.startClientTickLoop();
    return () => this.disconnect();
  }

  disconnect() {
    this.client.unsubscribe();
    useAviatorStore.getState().setConnected(false);
    this.stopClientTickLoop();
  }

  toggleMusic(enabled: boolean) {
    this.applyMusicPreference(enabled, true);
  }

  restoreMusicPreference() {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(AviatorController.MUSIC_STORAGE_KEY);
    if (!stored) {
      return;
    }

    this.applyMusicPreference(stored === 'on', false);
  }

  playClick() {
    this.audio.play('click');
  }

  private handleState(payload: GameStateMessage) {
    const store = useAviatorStore.getState();
    if (!store.isConnected) {
      store.setConnected(true);
    }
    store.setState(payload);
  }

  private handleHistory(payload: GameHistoryMessage) {
    useAviatorStore.getState().setHistory(payload.entries);
  }

  private handleBetResult(payload: BetResultMessage) {
    useAviatorStore.getState().setBetResult(payload);
    this.audio.play(payload.status === 'accepted' ? 'win' : 'lose');
  }

  private handleCashoutResult(payload: CashoutResultMessage) {
    useAviatorStore.getState().setCashoutResult(payload);
    this.audio.play(payload.status === 'credited' ? 'win' : 'lose');
  }

  private handleWalletSnapshot(payload: WalletSnapshot) {
    useAviatorStore.getState().syncWalletSnapshot(payload);
  }

  private startClientTickLoop() {
    if (!AviatorController.ENABLE_CLIENT_TICK || typeof window === 'undefined') {
      return;
    }

    if (this.tickTimer) {
      return;
    }

    this.tickTimer = window.setInterval(() => {
      fetch('/api/aviator/tick', { method: 'POST' }).catch(() => {
        /* ignora erros transitórios */
      });
    }, AviatorController.CLIENT_TICK_INTERVAL_MS);
  }

  private stopClientTickLoop() {
    if (this.tickTimer) {
      window.clearInterval(this.tickTimer);
      this.tickTimer = undefined;
    }
  }

  private applyMusicPreference(enabled: boolean, persist: boolean) {
    useAviatorStore.getState().setMusicEnabled(enabled);
    this.audio.toggleMusic(enabled);

    if (persist && typeof window !== 'undefined') {
      window.localStorage.setItem(
        AviatorController.MUSIC_STORAGE_KEY,
        enabled ? 'on' : 'off'
      );
    }
  }
}
