export interface CrashStrategy {
  nextCrashMultiplier(): number;
}

export class FixedCrashStrategy implements CrashStrategy {
  constructor(private readonly multiplier: number = 2.5) {}

  nextCrashMultiplier(): number {
    return this.multiplier;
  }
}
