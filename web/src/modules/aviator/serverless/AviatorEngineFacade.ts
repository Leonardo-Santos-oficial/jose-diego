import type {
  BetResultMessage,
  CashoutResultMessage,
  GameHistoryMessage,
} from '@/types/aviator';
import {
  DEFAULT_ENGINE_SETTINGS,
  type CashoutInput,
  type EngineSettings,
  type EngineState,
  type EngineTickResult,
  type PlaceBetInput,
} from '@/modules/aviator/serverless/types';
import {
  SupabaseEngineStateRepository,
  type EngineStateRepository,
} from '@/modules/aviator/serverless/repositories/engineStateRepository';
import {
  SupabaseRealtimePublisher,
  type AviatorRealtimePublisher,
} from '@/modules/aviator/serverless/publishers/realtimePublisher';
import {
  ProvablyFairStrategy,
  type CrashStrategy,
} from '@/modules/aviator/serverless/strategies/crashStrategy';
import { PlaceBetCommand } from '@/modules/aviator/serverless/commands/placeBetCommand';
import { CashoutCommand } from '@/modules/aviator/serverless/commands/cashoutCommand';
import { AutoCashoutService } from '@/modules/aviator/serverless/services/autoCashoutService';
import type { GameStateMessage } from '@/types/aviator';

export class AviatorEngineFacade {
  private readonly autoCashout: AutoCashoutService;

  constructor(
    private readonly repo: EngineStateRepository,
    private readonly publisher: AviatorRealtimePublisher,
    private readonly strategy: CrashStrategy,
    private readonly settings: EngineSettings = DEFAULT_ENGINE_SETTINGS
  ) {
    this.autoCashout = new AutoCashoutService(repo, publisher);
  }

  async tick(now: Date = new Date()): Promise<EngineTickResult> {
    let state = await this.repo.ensureState(
      this.strategy.pickTargetMultiplier(this.settings),
      this.settings
    );

    if (!state.roundId) {
      const roundId = await this.repo.createRound('awaitingBets');
      state = await this.repo.updateState(state.id, {
        roundId,
        phase: 'awaitingBets',
        phaseStartedAt: now.toISOString(),
        currentMultiplier: 1,
      });
    }

    let historyMessage: GameHistoryMessage | undefined;

    switch (state.phase) {
      case 'awaitingBets': {
        const elapsed = elapsedMs(state.phaseStartedAt, now);
        if (elapsed >= this.settings.bettingWindowMs) {
          await this.repo.setRoundStatus(state.roundId, 'flying');
          state = await this.repo.updateState(state.id, {
            phase: 'flying',
            phaseStartedAt: now.toISOString(),
            currentMultiplier: 1,
          });
        }
        break;
      }
      case 'flying': {
        const nextMultiplier = calculateMultiplier(state, now, this.settings);
        const willCrash = nextMultiplier >= state.targetMultiplier;

        if (willCrash) {
          await this.autoCashout.run(state.roundId, state.targetMultiplier);
          await this.repo.setRoundStatus(
            state.roundId,
            'crashed',
            state.targetMultiplier
          );
          state = await this.repo.updateState(state.id, {
            phase: 'crashed',
            phaseStartedAt: now.toISOString(),
            currentMultiplier: state.targetMultiplier,
          });
          const historyEntries = await this.repo.fetchHistory(this.settings.historySize);
          historyMessage = { entries: historyEntries };
        } else {
          state = await this.repo.updateState(state.id, {
            currentMultiplier: nextMultiplier,
          });
          await this.autoCashout.run(state.roundId, nextMultiplier);
        }
        break;
      }
      case 'crashed': {
        const elapsed = elapsedMs(state.phaseStartedAt, now);
        if (elapsed >= this.settings.resetDelayMs) {
          const targetMultiplier = this.strategy.pickTargetMultiplier(this.settings);
          const roundId = await this.repo.createRound('awaitingBets');
          await this.repo.setRoundStatus(roundId, 'awaitingBets');
          state = await this.repo.updateState(state.id, {
            roundId,
            phase: 'awaitingBets',
            phaseStartedAt: now.toISOString(),
            currentMultiplier: 1,
            targetMultiplier,
          });
        }
        break;
      }
      default:
        break;
    }

    const stateMessage = buildStateMessage(state, now, this.settings);
    await this.publisher.publishState(stateMessage);
    if (historyMessage) {
      await this.publisher.publishHistory(historyMessage);
    }

    return { state, stateMessage, historyMessage };
  }

  async placeBet(input: PlaceBetInput): Promise<BetResultMessage> {
    const state = await this.repo.ensureState(
      this.strategy.pickTargetMultiplier(this.settings),
      this.settings
    );
    const command = new PlaceBetCommand(this.repo, this.publisher);
    return command.execute(input, state);
  }

  async cashout(input: CashoutInput): Promise<CashoutResultMessage> {
    const state = await this.repo.ensureState(
      this.strategy.pickTargetMultiplier(this.settings),
      this.settings
    );
    const command = new CashoutCommand(this.repo, this.publisher);
    return command.execute(input, state);
  }
}

export function createAviatorEngineFacade(): AviatorEngineFacade {
  const repo = new SupabaseEngineStateRepository();
  const publisher = new SupabaseRealtimePublisher();
  const strategy = new ProvablyFairStrategy();
  return new AviatorEngineFacade(repo, publisher, strategy);
}

function buildStateMessage(
  state: EngineState,
  now: Date,
  settings: EngineSettings
): GameStateMessage {
  const message: GameStateMessage = {
    roundId: state.roundId,
    state: state.phase,
    multiplier:
      state.phase === 'awaitingBets' ? 1 : Number(state.currentMultiplier.toFixed(2)),
    phaseStartedAt: state.phaseStartedAt,
  };

  if (state.phase === 'awaitingBets') {
    const closesInMs = Math.max(
      settings.bettingWindowMs - elapsedMs(state.phaseStartedAt, now),
      0
    );
    message.bettingWindow = {
      closesInMs,
      minBet: 0.5,
      maxBet: 500,
    };
  }

  return message;
}

function calculateMultiplier(
  state: EngineState,
  now: Date,
  settings: EngineSettings
): number {
  const elapsed = elapsedMs(state.phaseStartedAt, now);
  const flightProgress = Math.min(elapsed / settings.flightDurationMs, 1);
  const multiplier = 1 + flightProgress * (state.targetMultiplier - 1);
  return Number(Math.max(multiplier, 1).toFixed(2));
}

function elapsedMs(startIso: string, now: Date): number {
  const start = new Date(startIso).getTime();
  return Math.max(now.getTime() - start, 0);
}
