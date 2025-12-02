import { randomUUID } from 'node:crypto';
import {
  defaultLoopConfig,
  type GameLoopConfig,
  type GamePhase,
  type HistoryEntry,
  type HistoryBucket
} from './types.js';
import type { StatePayload, RealtimePublisher } from '../publisher/realtimePublisher.js';
import type { CrashStrategy } from '../strategy/crashStrategy.js';
import type { AutoCashoutService } from '../services/autoCashoutService.js';
import type { RoundService } from '../services/roundService.js';
import type { EngineStateService } from '../services/engineStateService.js';
import { logger } from '../logger.js';

interface MachineContext {
  roundId: string;
  crashTarget: number;
  multiplier: number;
  phase: GamePhase;
  phaseStartedAt: Date;
  bettingWindowRemainingMs: number;
  seed: string;
  hash: string;
}

interface MachineDependencies {
  publisher: RealtimePublisher;
  strategy: CrashStrategy;
  autoCashoutService: AutoCashoutService;
  roundService: RoundService;
  engineStateService?: EngineStateService;
  config?: Partial<GameLoopConfig>;
}

abstract class GameState {
  constructor(protected readonly machine: GameStateMachine) {}
  enter(): void {}
  exit(): void {}
  abstract tick(deltaMs: number): void;
}

class AwaitingBetsState extends GameState {
  enter(): void {
    this.machine.setPhase('awaitingBets');
    this.machine.resetBettingWindow();
    this.machine.publishState({
      bettingWindowRemainingMs: this.machine.getContext().bettingWindowRemainingMs
    });
  }

  tick(deltaMs: number): void {
    const next = Math.max(this.machine.getContext().bettingWindowRemainingMs - deltaMs, 0);
    this.machine.updateContext({ bettingWindowRemainingMs: next });
    this.machine.publishState({ bettingWindowRemainingMs: next });
    if (next <= 0) {
      this.machine.transitionTo('flying');
    }
  }
}

class FlyingState extends GameState {
  enter(): void {
    this.machine.setPhase('flying');
    this.machine.updateContext({ multiplier: 1 });
    this.machine.publishState({
      targetMultiplier: this.machine.getContext().crashTarget
    });
  }

  tick(deltaMs: number): void {
    const current = this.machine.getContext().multiplier;
    const crashTarget = this.machine.getContext().crashTarget;
    
    // CRITICAL: Apply max multiplier limit to prevent runaway values
    const maxMultiplier = this.machine.config.maxCrashMultiplier ?? 100;
    const safeCrashTarget = Math.min(crashTarget, maxMultiplier);
    
    const next = current + deltaMs * 0.001;
    const capped = Math.min(next, safeCrashTarget, maxMultiplier);
    
    this.machine.updateContext({ multiplier: capped });
    this.machine.publishState({});
    
    void this.machine.processAutoCashout(capped);

    if (capped >= safeCrashTarget) {
      this.machine.transitionTo('crashed');
    }
  }
}

class CrashedState extends GameState {
  private elapsed = 0;

  enter(): void {
    this.machine.setPhase('crashed');
    this.machine.publishState({});
    this.machine.onCrashEntered();
    this.elapsed = 0;
  }

  tick(deltaMs: number): void {
    this.elapsed += deltaMs;
    if (this.elapsed >= this.machine.config.settleDelayMs) {
      this.machine.transitionTo('awaitingBets', { resetRound: true });
    }
  }
}

interface TransitionOptions {
  resetRound?: boolean;
}

export class GameStateMachine {
  private state: GameState;
  private context: MachineContext;
  private history: HistoryEntry[] = [];
  public config: GameLoopConfig; // Changed to mutable to allow settings update
  private currentRtp: number = 97; // Default RTP

  constructor(private readonly deps: MachineDependencies) {
    this.config = { ...defaultLoopConfig, ...deps.config };
    this.context = this.createRoundContext();
    this.state = this.buildState('awaitingBets');
    this.state.enter();
    // Load initial RTP from database
    void this.loadRtpFromDatabase();
  }

  private async loadRtpFromDatabase(): Promise<void> {
    if (!this.deps.engineStateService) return;
    try {
      const settings = await this.deps.engineStateService.getSettings();
      if (settings) {
        // Load RTP
        if (settings.rtp !== undefined) {
          this.currentRtp = settings.rtp;
        }
        // Load crash multiplier limits
        if (settings.minCrashMultiplier !== undefined) {
          this.config = { ...this.config, minCrashMultiplier: settings.minCrashMultiplier };
        }
        if (settings.maxCrashMultiplier !== undefined) {
          this.config = { ...this.config, maxCrashMultiplier: settings.maxCrashMultiplier };
        }
        // Load pending nextCrashTarget (for when server restarts with pending forced result)
        if (settings.nextCrashTarget !== undefined && settings.nextCrashTarget > 0) {
          this.nextRoundCrashTarget = settings.nextCrashTarget;
          logger.info({ nextCrashTarget: settings.nextCrashTarget }, 'Loaded pending crash target from database');
        }
        logger.info({ 
          rtp: this.currentRtp, 
          minCrashMultiplier: this.config.minCrashMultiplier,
          maxCrashMultiplier: this.config.maxCrashMultiplier,
          nextCrashTarget: this.nextRoundCrashTarget
        }, 'Engine settings loaded from database');
      }
    } catch {
      // Use default settings if unable to load
    }
  }

  /** Update the RTP value used for crash calculations */
  setRtp(rtp: number): void {
    this.currentRtp = Math.max(0, Math.min(100, rtp));
  }

  tick(deltaMs: number): void {
    this.state.tick(deltaMs);
  }

  async processAutoCashout(multiplier: number): Promise<void> {
    await this.deps.autoCashoutService.run(this.context.roundId, multiplier);
  }

  getContext(): MachineContext {
    return this.context;
  }

  publishState(extra: Partial<StatePayload>): void {
    const bettingWindowRemainingMs = extra.bettingWindowRemainingMs ?? this.context.bettingWindowRemainingMs;
    
    const payload: StatePayload = {
      roundId: this.context.roundId,
      phase: this.context.phase,
      state: this.context.phase, // Frontend expects 'state', not 'phase'
      multiplier: this.context.multiplier,
      phaseStartedAt: this.context.phaseStartedAt,
      hash: this.context.hash,
      // Frontend expects bettingWindow.closesInMs format
      bettingWindow: {
        closesInMs: bettingWindowRemainingMs ?? 0
      },
      ...extra
    };
    void this.deps.publisher.publishState(payload);
  }

  updateContext(patch: Partial<MachineContext>): void {
    this.context = { ...this.context, ...patch };
  }

  resetBettingWindow(): void {
    this.context = {
      ...this.context,
      bettingWindowRemainingMs: this.config.bettingWindowMs,
      multiplier: 1
    };
  }

  setPhase(phase: GamePhase): void {
    this.context = {
      ...this.context,
      phase,
      phaseStartedAt: new Date()
    };
  }

  transitionTo(phase: GamePhase, options?: TransitionOptions): void {
    if (options?.resetRound) {
      this.context = this.createRoundContext();
    }
    this.state.exit();
    this.state = this.buildState(phase);
    this.state.enter();
  }

  forceCrash(): void {
    if (this.context.phase !== 'flying') {
      return;
    }
    this.updateContext({ crashTarget: this.context.multiplier });
    this.transitionTo('crashed');
  }

  /**
   * Sets the crash target for the NEXT round.
   * This is stored and will be applied when a new round starts.
   */
  private nextRoundCrashTarget?: number;

  setNextCrashTarget(multiplier: number): void {
    this.nextRoundCrashTarget = multiplier;
  }

  private async clearNextCrashTargetInDatabase(): Promise<void> {
    if (!this.deps.engineStateService) return;
    try {
      const settings = await this.deps.engineStateService.getSettings();
      if (settings && settings.nextCrashTarget !== undefined) {
        // Remove nextCrashTarget from settings
        const { nextCrashTarget: _, ...settingsWithoutTarget } = settings as any;
        await this.deps.engineStateService.clearNextCrashTarget();
      }
    } catch (error) {
      logger.error({ error }, 'Failed to clear nextCrashTarget from database');
    }
  }

  onCrashEntered(): void {
    this.recordHistoryEntry();
    // Update round status in database
    void this.deps.roundService.finishRound(this.context.roundId, this.context.multiplier);
  }

  private recordHistoryEntry(): void {
    if (this.context.phase !== 'crashed') {
      return;
    }

    const entry: HistoryEntry = {
      roundId: this.context.roundId,
      multiplier: this.context.multiplier,
      bucket: this.getBucketForMultiplier(this.context.multiplier),
      finishedAt: new Date()
    };

    this.history = [entry, ...this.history].slice(0, this.config.historySize);
    void this.deps.publisher.publishHistory({
      entries: this.history.map((item) => ({
        roundId: item.roundId,
        multiplier: item.multiplier,
        bucket: item.bucket,
        finishedAt: item.finishedAt.toISOString()
      }))
    });
  }

  private getBucketForMultiplier(multiplier: number): HistoryBucket {
    if (multiplier < 2) {
      return 'blue';
    }
    if (multiplier < 10) {
      return 'purple';
    }
    return 'pink';
  }

  private createRoundContext(): MachineContext {
    // Pass current RTP and max multiplier to the strategy for crash calculation
    const crash = this.deps.strategy.nextCrash({ 
      rtp: this.currentRtp,
      maxCrashMultiplier: this.config.maxCrashMultiplier,
      minCrashMultiplier: this.config.minCrashMultiplier,
    });
    const roundId = randomUUID();
    
    // Use admin-forced crash target if set, otherwise use strategy result
    let crashTarget = crash.multiplier;
    if (this.nextRoundCrashTarget !== undefined) {
      crashTarget = this.nextRoundCrashTarget;
      logger.info({ forcedCrashTarget: crashTarget }, 'Using forced crash target for this round');
      this.nextRoundCrashTarget = undefined; // Clear after use
      // Clear from database too to prevent reuse after restart
      void this.clearNextCrashTargetInDatabase();
    }
    
    // CRITICAL: Always validate crashTarget against configured limits
    const minMultiplier = this.config.minCrashMultiplier ?? 1.0;
    const maxMultiplier = this.config.maxCrashMultiplier ?? 100;
    
    if (crashTarget < minMultiplier) crashTarget = minMultiplier;
    if (crashTarget > maxMultiplier) crashTarget = maxMultiplier;
    
    // Create round in database asynchronously
    // We don't await here as the constructor is sync, but the round will be created
    // before any bets can be placed (bettingWindowMs delay provides enough time)
    void this.deps.roundService.createRound(roundId);
    
    return {
      roundId,
      crashTarget,
      multiplier: 1,
      phase: 'awaitingBets',
      phaseStartedAt: new Date(),
      bettingWindowRemainingMs: this.config.bettingWindowMs,
      seed: crash.seed,
      hash: crash.hash
    };
  }

  private buildState(phase: GamePhase): GameState {
    switch (phase) {
      case 'awaitingBets':
        return new AwaitingBetsState(this);
      case 'flying':
        return new FlyingState(this);
      case 'crashed':
        return new CrashedState(this);
      default:
        return new AwaitingBetsState(this);
    }
  }
}
