import { describe, expect, it, vi } from 'vitest';
import { AviatorEngineFacade } from '@/modules/aviator/serverless/AviatorEngineFacade';
import type { AviatorRealtimePublisher } from '@/modules/aviator/serverless/publishers/realtimePublisher';
import type { EngineStateRepository } from '@/modules/aviator/serverless/repositories/engineStateRepository';
import {
  DEFAULT_ENGINE_SETTINGS,
  type EngineSettings,
  type EngineState,
} from '@/modules/aviator/serverless/types';
import type { CrashStrategy } from '@/modules/aviator/serverless/strategies/crashStrategy';
import type { GameHistoryEntry, GameHistoryMessage } from '@/types/aviator';

class FixedStrategy implements CrashStrategy {
  constructor(private readonly target: number) {}

  pickTargetMultiplier(): number {
    return this.target;
  }
}

class InMemoryEngineRepository implements EngineStateRepository {
  state: EngineState;
  history: GameHistoryEntry[];
  constructor(settings: EngineSettings) {
    this.state = {
      id: 'engine-state',
      roundId: 'round-active',
      phase: 'flying',
      phaseStartedAt: new Date(Date.now() - 2_000).toISOString(),
      currentMultiplier: 1.2,
      targetMultiplier: 1.3,
      settings,
    };
    this.history = [
      {
        roundId: 'history-1',
        multiplier: 2.1,
        finishedAt: new Date().toISOString(),
        bucket: 'purple',
      },
    ];
  }

  async ensureState(): Promise<EngineState> {
    return this.state;
  }

  async updateState(
    _id: string,
    data: Partial<{
      phase: EngineState['phase'];
      phaseStartedAt: string;
      currentMultiplier: number;
      targetMultiplier: number;
      roundId: string;
      settings: EngineSettings;
    }>,
    fallbackSettings: EngineSettings = DEFAULT_ENGINE_SETTINGS
  ): Promise<EngineState> {
    this.state = {
      ...this.state,
      phase: data.phase ?? this.state.phase,
      phaseStartedAt: data.phaseStartedAt ?? this.state.phaseStartedAt,
      currentMultiplier: data.currentMultiplier ?? this.state.currentMultiplier,
      targetMultiplier: data.targetMultiplier ?? this.state.targetMultiplier,
      roundId: data.roundId ?? this.state.roundId,
      settings: data.settings ?? this.state.settings ?? fallbackSettings,
    };
    return this.state;
  }

  async setRoundStatus(): Promise<void> {}

  async createRound(): Promise<string> {
    return this.state.roundId;
  }

  async fetchHistory(limit: number): Promise<GameHistoryEntry[]> {
    return this.history.slice(0, limit);
  }

  async listAutoCashoutCandidates() {
    return [];
  }

  async getTicketInfo() {
    return null;
  }

  async performBet() {
    return {
      ticketId: 'mock-ticket',
      balance: 0,
      updatedAt: new Date().toISOString(),
    };
  }

  async performCashout() {
    return {
      ticketId: 'mock-ticket',
      creditedAmount: 0,
      payoutMultiplier: 1,
      balance: 0,
      updatedAt: new Date().toISOString(),
    };
  }
}

describe('AviatorEngineFacade', () => {
  it('publica estado e histórico quando o round cai', async () => {
    const settings: EngineSettings = {
      ...DEFAULT_ENGINE_SETTINGS,
      flightDurationMs: 1_000,
    };
    const repo = new InMemoryEngineRepository(settings);
    const publishStateMock = vi.fn(async () => {});
    const publishHistoryMock = vi.fn<[GameHistoryMessage], Promise<void>>(async () => {});
    const publishBetResultMock = vi.fn(async () => {});
    const publishCashoutResultMock = vi.fn(async () => {});

    const publisher: AviatorRealtimePublisher = {
      publishState:
        publishStateMock as unknown as AviatorRealtimePublisher['publishState'],
      publishHistory:
        publishHistoryMock as unknown as AviatorRealtimePublisher['publishHistory'],
      publishBetResult:
        publishBetResultMock as unknown as AviatorRealtimePublisher['publishBetResult'],
      publishCashoutResult:
        publishCashoutResultMock as unknown as AviatorRealtimePublisher['publishCashoutResult'],
    };

    const facade = new AviatorEngineFacade(
      repo,
      publisher,
      new FixedStrategy(repo.state.targetMultiplier),
      settings
    );

    await facade.tick(new Date());

    expect(publishStateMock).toHaveBeenCalledTimes(1);
    expect(publishHistoryMock).toHaveBeenCalledTimes(1);
    const historyPayload = publishHistoryMock.mock.calls.at(0)?.[0];
    expect(historyPayload).toBeDefined();
    if (!historyPayload) {
      throw new Error('publishHistory deveria receber um payload.');
    }

    expect(historyPayload.entries).toHaveLength(1);
    expect(historyPayload.entries[0]?.roundId).toBe('history-1');
  });
});
