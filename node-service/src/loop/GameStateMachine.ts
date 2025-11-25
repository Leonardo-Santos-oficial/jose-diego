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
    const next = current + deltaMs * 0.001;
    const capped = Math.min(next, this.machine.getContext().crashTarget);
    this.machine.updateContext({ multiplier: capped });
    this.machine.publishState({});
    if (capped >= this.machine.getContext().crashTarget) {
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
  public readonly config: GameLoopConfig;

  constructor(private readonly deps: MachineDependencies) {
    this.config = { ...defaultLoopConfig, ...deps.config };
    this.context = this.createRoundContext();
    this.state = this.buildState('awaitingBets');
    this.state.enter();
  }

  tick(deltaMs: number): void {
    this.state.tick(deltaMs);
  }

  getContext(): MachineContext {
    return this.context;
  }

  publishState(extra: Partial<StatePayload>): void {
    const payload: StatePayload = {
      roundId: this.context.roundId,
      phase: this.context.phase,
      multiplier: this.context.multiplier,
      phaseStartedAt: this.context.phaseStartedAt,
      hash: this.context.hash,
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

  onCrashEntered(): void {
    this.recordHistoryEntry();
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
    const crash = this.deps.strategy.nextCrash();
    return {
      roundId: randomUUID(),
      crashTarget: crash.multiplier,
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
