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
  private static readonly MUSIC_STORAGE_KEY = 'aviator:music-enabled';

  constructor(
    userId: string,
    client: AviatorRealtimeClient = new AviatorRealtimeClient(),
    audio: AviatorAudioEngine = new AviatorAudioEngine()
  ) {
    this.client = client;
    this.audio = audio;
    this.userId = userId;
  }

  connect(): () => void {
    this.client.subscribe(
      {
        onState: (payload) => this.handleState(payload),
        onHistory: (payload) => this.handleHistory(payload),
        onBetResult: (payload) => this.handleBetResult(payload),
        onCashoutResult: (payload) => this.handleCashoutResult(payload),
        onWalletSnapshot: (payload: WalletSnapshot) => this.handleWalletSnapshot(payload),
      },
      { userId: this.userId }
    );

    useAviatorStore.getState().setConnected(true);
    return () => this.disconnect();
  }

  disconnect() {
    this.client.unsubscribe();
    useAviatorStore.getState().setConnected(false);
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
    useAviatorStore.getState().setState(payload);
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
