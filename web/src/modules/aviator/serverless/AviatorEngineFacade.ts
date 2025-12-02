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
    // 1. Process Admin Commands
    const commands = await this.repo.fetchPendingCommands();
    let forceCrash = false;

    for (const cmd of commands) {
      try {
        if (cmd.action === 'pause') {
          // Update settings to paused
          const newSettings = { ...this.settings, paused: true };
          // We need to persist this change to DB so subsequent ticks respect it
          // But ensureState reads from DB.
          // We should update the state immediately.
          // However, we don't have the state ID yet.
          // Let's fetch state first? No, ensureState does that.
        } else if (cmd.action === 'resume') {
           // Update settings to unpaused
        } else if (cmd.action === 'force_crash') {
          forceCrash = true;
        }
        await this.repo.markCommandProcessed(cmd.id, 'processed');
      } catch (e) {
        console.error('Failed to process command', cmd, e);
        await this.repo.markCommandProcessed(cmd.id, 'failed');
      }
    }

    // We need to fetch state *after* potentially processing commands that might affect global settings?
    // Actually, commands like 'pause' should update the DB state.
    // Since we don't have the state object yet, we can't update it easily.
    // Let's fetch state first.

    // IMPORTANT: First get existing state to use its settings (including RTP from admin panel)
    // This ensures we always use the configured RTP, not the default
    let state = await this.repo.ensureState(
      // Placeholder crashResult - will be regenerated with correct settings if needed
      this.strategy.pickTargetMultiplier(this.settings),
      this.settings
    );
    
    // If state was just created or needs a new round, regenerate crash with correct settings from DB
    if (state.settings?.rtp !== undefined && state.settings.rtp !== this.settings.rtp) {
      // The state has custom RTP from admin panel, make sure it's being used
      // This is handled in the 'crashed' phase transition below
    }

    // Now apply commands to the fetched state/settings
    for (const cmd of commands) {
      if (cmd.action === 'pause') {
        const newSettings = { ...state.settings, paused: true };
        state = await this.repo.updateState(state.id, { settings: newSettings });
      } else if (cmd.action === 'resume') {
        const newSettings = { ...state.settings, paused: false };
        state = await this.repo.updateState(state.id, { settings: newSettings });
      } else if (cmd.action === 'set_result') {
        const forcedResult = typeof cmd.payload?.value === 'number' ? cmd.payload.value : parseFloat(cmd.payload?.value);
        if (!isNaN(forcedResult)) {
          const newSettings = { ...state.settings, forcedResult };
          state = await this.repo.updateState(state.id, { settings: newSettings });
        }
      } else if (cmd.action === 'update_settings') {
        const newSettings = { ...state.settings, ...cmd.payload };
        state = await this.repo.updateState(state.id, { settings: newSettings });
      }
    }

    // Check if paused
    if ((state.settings as any)?.paused) {
      const stateMessage = buildStateMessage(state, now, this.settings);
      return { state, stateMessage };
    }

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
        const willCrash = forceCrash || nextMultiplier >= state.targetMultiplier;

        if (willCrash) {
          await this.autoCashout.run(state.roundId, state.targetMultiplier);
          // If forced crash, use current multiplier (or 1.0 if just started?)
          // Actually if forced, we should probably crash at current multiplier.
          const crashValue = forceCrash ? state.currentMultiplier : state.targetMultiplier;
          
          await this.repo.setRoundStatus(
            state.roundId,
            'crashed',
            crashValue
          );
          state = await this.repo.updateState(state.id, {
            phase: 'crashed',
            phaseStartedAt: now.toISOString(),
            currentMultiplier: crashValue,
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
        // Use state.settings for resetDelayMs if available, otherwise fallback to default
        const resetDelay = state.settings?.resetDelayMs ?? this.settings.resetDelayMs;
        
        if (elapsed >= resetDelay) {
          const crashResult = this.strategy.pickTargetMultiplier(state.settings);
          
          // If forcedResult was used, clear it for the next round
          let nextSettings = state.settings;
          if (state.settings.forcedResult) {
             nextSettings = { ...state.settings, forcedResult: null };
          }

          const roundId = await this.repo.createRound('awaitingBets');
          await this.repo.setRoundStatus(roundId, 'awaitingBets');
          state = await this.repo.updateState(state.id, {
            roundId,
            phase: 'awaitingBets',
            phaseStartedAt: now.toISOString(),
            currentMultiplier: 1,
            targetMultiplier: crashResult.multiplier,
            serverSeed: crashResult.seed,
            serverHash: crashResult.hash,
            settings: nextSettings,
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
    hash: state.serverHash,
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
  
  // CRITICAL: Ensure targetMultiplier is within valid bounds
  const maxMultiplier = settings.maxCrashMultiplier ?? 100;
  const safeTargetMultiplier = Math.min(state.targetMultiplier, maxMultiplier);
  
  const multiplier = 1 + flightProgress * (safeTargetMultiplier - 1);
  
  // Double safety: cap the final result
  const cappedMultiplier = Math.min(Math.max(multiplier, 1), maxMultiplier);
  return Number(cappedMultiplier.toFixed(2));
}

function elapsedMs(startIso: string, now: Date): number {
  const start = new Date(startIso).getTime();
  return Math.max(now.getTime() - start, 0);
}
