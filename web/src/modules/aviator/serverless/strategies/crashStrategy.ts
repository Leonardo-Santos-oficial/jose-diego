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
    // 0. Check for forced result
    if (settings.forcedResult != null && settings.forcedResult > 0) {
      const seed = randomBytes(32).toString('hex');
      const hash = createHash('sha256').update(seed).digest('hex');
      return {
        multiplier: settings.forcedResult,
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
    
    // Standard crash game formula: E / (E - h)
    // But we need to handle the "house edge" (instant crash at 1.00x)
    // Usually 1% to 4% of games crash instantly.
    
    // Let's use a simpler logic often used in these demos:
    // 0.99 / (1 - random)
    
    // Using the seed to generate a uniform float [0, 1)
    const randomFloat = h / e;

    // House Edge: 1% chance of instant crash (default)
    // If randomFloat is very close to 1, result is huge.
    // Formula: multiplier = (100 * E - h) / (E - h) / 100 ... simplified:
    
    const rtp = settings.rtp ?? 97.0;
    const houseEdge = (100 - rtp) / 100; // e.g. 3% = 0.03
    
    // Calculate multiplier
    // X = (1 - houseEdge) / (1 - U)
    const rawMultiplier = (1 - houseEdge) / (1 - randomFloat);
    
    // Clamp to 1.00 if it's less (shouldn't happen with this formula but safety first)
    // And round to 2 decimal places
    let multiplier = Math.floor(rawMultiplier * 100) / 100;

    // Safety clamp
    if (multiplier < 1) multiplier = 1;
    
    // Cap at a reasonable max for the demo (e.g., 10000x) to prevent overflow issues
    if (multiplier > 10000) multiplier = 10000;

    return {
      multiplier,
      seed,
      hash,
    };
  }
}
