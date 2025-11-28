import { createHash, randomBytes } from 'node:crypto';
import type { CrashResult, CrashStrategy, CrashOptions } from './crashStrategy.js';

export class ProvablyFairStrategy implements CrashStrategy {
  nextCrash(options?: CrashOptions): CrashResult {
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
    // RTP of 5% means 95% house edge (very aggressive)
    const rtp = options?.rtp ?? 97; // Default RTP is 97%
    const houseEdge = (100 - rtp) / 100; // Convert percentage to decimal
    
    // Calculate multiplier using the formula: X = (1 - houseEdge) / (1 - U)
    // Where U is a uniform random number [0, 1)
    const rawMultiplier = (1 - houseEdge) / (1 - randomFloat);
    
    // Round to 2 decimal places
    let multiplier = Math.floor(rawMultiplier * 100) / 100;

    // Safety clamp - minimum is 1.00x
    if (multiplier < 1) multiplier = 1;
    
    // Cap at a reasonable max (e.g., 10000x) to prevent overflow issues
    if (multiplier > 10000) multiplier = 10000;

    return {
      multiplier,
      seed,
      hash,
    };
  }
}
