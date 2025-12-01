import { createHash, randomBytes } from 'crypto';
import {
  DEFAULT_ENGINE_SETTINGS,
  type EngineSettings,
} from '@/modules/aviator/serverless/types';

export interface CrashResult {
  multiplier: number;
  seed: string;
  hash: string;
}

export interface CrashStrategy {
  pickTargetMultiplier(settings?: EngineSettings): CrashResult;
}

export class ProvablyFairStrategy implements CrashStrategy {
  pickTargetMultiplier(settings: EngineSettings = DEFAULT_ENGINE_SETTINGS): CrashResult {
    // Get max multiplier from settings (critical for RTP control)
    const maxMultiplier = settings.maxCrashMultiplier ?? 35;
    const minMultiplier = settings.minCrashMultiplier ?? 1.0;

    // 0. Check for forced result (admin override)
    if (settings.forcedResult != null && settings.forcedResult > 0) {
      const seed = randomBytes(32).toString('hex');
      const hash = createHash('sha256').update(seed).digest('hex');
      // Even forced results must respect the max limit
      const clampedForced = Math.min(Math.max(settings.forcedResult, minMultiplier), maxMultiplier);
      return {
        multiplier: clampedForced,
        seed,
        hash,
      };
    }

    // 1. Generate a random server seed (32 bytes hex)
    const seed = randomBytes(32).toString('hex');

    // 2. Create the public hash of this seed
    const hash = createHash('sha256').update(seed).digest('hex');

    // 3. Calculate the multiplier using the seed
    // We use the first 52 bits (13 hex chars) for 52-bit precision
    const h = parseInt(seed.slice(0, 13), 16);
    const e = Math.pow(2, 52);
    
    // Using the seed to generate a uniform float [0, 1)
    const randomFloat = h / e;

    // RTP (Return To Player) determines house edge
    const rtp = settings.rtp ?? 97.0;
    const houseEdge = (100 - rtp) / 100; // e.g. 3% = 0.03
    
    // Calculate multiplier using formula: X = (1 - houseEdge) / (1 - U)
    const rawMultiplier = (1 - houseEdge) / (1 - randomFloat);
    
    // Round to 2 decimal places
    let multiplier = Math.floor(rawMultiplier * 100) / 100;

    // CRITICAL: Apply strict min/max limits from settings
    if (multiplier < minMultiplier) multiplier = minMultiplier;
    if (multiplier > maxMultiplier) multiplier = maxMultiplier;

    return {
      multiplier,
      seed,
      hash,
    };
  }
}
