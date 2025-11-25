export interface CrashResult {
  multiplier: number;
  seed: string;
  hash: string;
}

export interface CrashStrategy {
  nextCrash(): CrashResult;
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
