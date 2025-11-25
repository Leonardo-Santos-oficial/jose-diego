/**
 * Simple in-memory rate limiter.
 * Note: In a serverless environment (like Vercel), this memory is not shared across lambdas.
 * For a production app with multiple instances, use Redis (e.g., @upstash/ratelimit).
 */
class RateLimiter {
  private limits = new Map<string, { count: number; expiresAt: number }>();

  /**
   * Checks if a key has exceeded the rate limit.
   * @param key Unique identifier (e.g., IP address or User ID)
   * @param limit Max number of requests allowed
   * @param windowMs Time window in milliseconds
   * @returns true if allowed, false if limited
   */
  check(key: string, limit: number, windowMs: number): boolean {
    const now = Date.now();
    const record = this.limits.get(key);

    if (!record || now > record.expiresAt) {
      this.limits.set(key, { count: 1, expiresAt: now + windowMs });
      return true;
    }

    if (record.count >= limit) {
      return false;
    }

    record.count += 1;
    return true;
  }

  /**
   * Cleans up expired entries to prevent memory leaks.
   */
  cleanup() {
    const now = Date.now();
    for (const [key, record] of this.limits.entries()) {
      if (now > record.expiresAt) {
        this.limits.delete(key);
      }
    }
  }
}

// Singleton instance
export const rateLimiter = new RateLimiter();

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => rateLimiter.cleanup(), 5 * 60 * 1000);
}
