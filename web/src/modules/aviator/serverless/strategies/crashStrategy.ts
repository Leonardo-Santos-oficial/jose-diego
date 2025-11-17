import {
  DEFAULT_ENGINE_SETTINGS,
  type EngineSettings,
} from '@/modules/aviator/serverless/types';

export interface CrashStrategy {
  pickTargetMultiplier(settings?: EngineSettings): number;
}

export class ProvablyFairStrategy implements CrashStrategy {
  constructor(private readonly randomFn: () => number = Math.random) {}

  pickTargetMultiplier(settings: EngineSettings = DEFAULT_ENGINE_SETTINGS): number {
    const min = settings.minCrashMultiplier;
    const max = settings.maxCrashMultiplier;
    const roll = this.randomFn();
    const target = min + roll * (max - min);
    return Number(target.toFixed(2));
  }
}
