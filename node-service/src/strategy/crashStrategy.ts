export interface CrashResult {
  multiplier: number;
  seed: string;
  hash: string;
}

export interface CrashOptions {
  /** RTP percentage (0-100). Default is 97. Lower RTP = more house edge = lower multipliers */
  rtp?: number;
}

export interface CrashStrategy {
  nextCrash(options?: CrashOptions): CrashResult;
}

export class FixedCrashStrategy implements CrashStrategy {
  constructor(private readonly multiplier: number = 2.5) {}

  nextCrash(): CrashResult {
    return {
      multiplier: this.multiplier,
      seed: 'fixed-strategy-seed',
      hash: 'fixed-strategy-hash',
    };
  }
}
