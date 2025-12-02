import { createHash, randomBytes } from 'node:crypto';
import type { CrashResult, CrashStrategy, CrashOptions } from './crashStrategy.js';

// Default limits - CRITICAL for RTP compliance
const DEFAULT_MAX_MULTIPLIER = 100;
const DEFAULT_MIN_MULTIPLIER = 1.0;

export class ProvablyFairStrategy implements CrashStrategy {
  nextCrash(options?: CrashOptions): CrashResult {
    // Get limits from options or use strict defaults
    const maxMultiplier = options?.maxCrashMultiplier ?? DEFAULT_MAX_MULTIPLIER;
    const minMultiplier = options?.minCrashMultiplier ?? DEFAULT_MIN_MULTIPLIER;

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
    const rtp = Math.max(1, Math.min(99, options?.rtp ?? 97)); // Clamp between 1-99%
    
    // The formula calculates crash point based on RTP
    // Using geometric distribution: crash_point = 1 / (1 - rand * (RTP/100))
    // This ensures that with lower RTP, crashes happen more often at lower values
    const rtpFactor = rtp / 100;
    
    // Calculate the crash point
    // The key insight: lower RTP means the random threshold for high multipliers is higher
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

    // CRITICAL: Apply strict min/max limits
    if (multiplier < minMultiplier) multiplier = minMultiplier;
    if (multiplier > maxMultiplier) multiplier = maxMultiplier;

    return {
      multiplier,
      seed,
      hash,
    };
  }
}
