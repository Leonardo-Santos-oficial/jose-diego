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
    const maxMultiplier = settings.maxCrashMultiplier ?? 100;
    const minMultiplier = settings.minCrashMultiplier ?? 1.0;

    // 0. Check for forced result (admin override)
    if (settings.forcedResult != null && settings.forcedResult > 0) {
      const seed = randomBytes(32).toString('hex');
      const hash = createHash('sha256').update(seed).digest('hex');
      // Forced results can go up to the max limit
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

    // RTP (Return To Player) determines the distribution of crash points
    // Higher RTP = more player-friendly (higher average multipliers)
    // Lower RTP = more house-friendly (lower average multipliers)
    const rtp = Math.max(1, Math.min(99, settings.rtp ?? 97)); // Clamp between 1-99%
    
    // The formula calculates crash point based on RTP
    // Using geometric distribution: crash_point = 1 / (1 - rand * (RTP/100))
    const rtpFactor = rtp / 100;
    
    // Calculate the crash point
    const crashThreshold = randomFloat * rtpFactor;
    
    let multiplier: number;
    if (crashThreshold >= 0.99) {
      // Very rare high multiplier
      multiplier = maxMultiplier;
    } else {
      // Standard formula adjusted for RTP
      multiplier = 1 / (1 - crashThreshold);
    }
    
    // Round to 2 decimal places
    multiplier = Math.floor(multiplier * 100) / 100;

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
