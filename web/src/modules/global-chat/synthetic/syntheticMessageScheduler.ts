import type { SyntheticMessage, SyntheticMessageGenerator, SyntheticSchedulerConfig } from './types';

type MessageHandler = (message: SyntheticMessage) => void;

const DEFAULT_CONFIG: SyntheticSchedulerConfig = {
  minIntervalMs: 15_000,
  maxIntervalMs: 45_000,
  probability: 0.6,
};

export class SyntheticMessageScheduler {
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private readonly config: SyntheticSchedulerConfig;

  constructor(
    private readonly generator: SyntheticMessageGenerator,
    private readonly onMessage: MessageHandler,
    config: Partial<SyntheticSchedulerConfig> = {}
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  start(): void {
    this.scheduleNext();
  }

  stop(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private scheduleNext(): void {
    const delay = this.calculateDelay();
    this.timeoutId = setTimeout(() => this.tick(), delay);
  }

  private tick(): void {
    if (this.shouldEmit()) {
      const message = this.generator.generate();
      this.onMessage(message);
    }
    this.scheduleNext();
  }

  private calculateDelay(): number {
    const { minIntervalMs, maxIntervalMs } = this.config;
    return minIntervalMs + Math.random() * (maxIntervalMs - minIntervalMs);
  }

  private shouldEmit(): boolean {
    return Math.random() < this.config.probability;
  }
}
