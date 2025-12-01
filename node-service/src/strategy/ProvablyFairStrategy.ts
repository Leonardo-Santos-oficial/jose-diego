import { createHash, randomBytes } from 'node:crypto';
import type { CrashResult, CrashStrategy, CrashOptions } from './crashStrategy.js';

// Default limits - CRITICAL for RTP compliance
const DEFAULT_MAX_MULTIPLIER = 35;
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

    // RTP (Return To Player) determines the house edge
    // RTP of 97% means 3% house edge
    const rtp = options?.rtp ?? 97; // Default RTP is 97%
    const houseEdge = (100 - rtp) / 100; // Convert percentage to decimal
    
    // Calculate multiplier using the formula: X = (1 - houseEdge) / (1 - U)
    // Where U is a uniform random number [0, 1)
    const rawMultiplier = (1 - houseEdge) / (1 - randomFloat);
    
    // Round to 2 decimal places
    let multiplier = Math.floor(rawMultiplier * 100) / 100;

    // CRITICAL: Apply strict min/max limits to prevent runaway multipliers
    if (multiplier < minMultiplier) multiplier = minMultiplier;
    if (multiplier > maxMultiplier) multiplier = maxMultiplier;

    return {
      multiplier,
      seed,
      hash,
    };
  }
}
