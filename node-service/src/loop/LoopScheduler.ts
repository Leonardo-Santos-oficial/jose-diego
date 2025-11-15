import type { GameStateMachine } from './GameStateMachine.js';
import { defaultLoopConfig } from './types.js';

export class LoopScheduler {
  private timer?: NodeJS.Timeout;
  private lastTick?: number;
  private paused = false;

  constructor(
    private readonly machine: GameStateMachine,
    private readonly tickIntervalMs: number = defaultLoopConfig.tickIntervalMs
  ) {}

  start(): void {
    if (this.timer) {
      return;
    }

    this.paused = false;
    this.lastTick = Date.now();
    this.timer = setInterval(() => {
      const now = Date.now();
      const delta = this.lastTick ? now - this.lastTick : this.tickIntervalMs;
      this.lastTick = now;
      this.machine.tick(delta);
    }, this.tickIntervalMs);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
    this.paused = false;
  }

  pause(): void {
    if (!this.timer) {
      return;
    }
    clearInterval(this.timer);
    this.timer = undefined;
    this.paused = true;
  }

  resume(): void {
    this.start();
  }

  isPaused(): boolean {
    return this.paused;
  }
}
