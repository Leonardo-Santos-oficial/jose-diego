import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

interface RateLimitRecord {
  count: number;
  expiresAt: number;
}

class TestableRateLimiter {
  private limits = new Map<string, RateLimitRecord>();

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

  cleanup(): void {
    const now = Date.now();
    for (const [key, record] of this.limits.entries()) {
      if (now > record.expiresAt) {
        this.limits.delete(key);
      }
    }
  }

  reset(): void {
    this.limits.clear();
  }

  getRecordCount(): number {
    return this.limits.size;
  }
}

describe('RateLimiter', () => {
  let rateLimiter: TestableRateLimiter;

  beforeEach(() => {
    rateLimiter = new TestableRateLimiter();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', () => {
      const limit = 5;
      const windowMs = 60000;

      for (let i = 0; i < limit; i++) {
        expect(rateLimiter.check('user-1', limit, windowMs)).toBe(true);
      }
    });

    it('should block requests exceeding limit', () => {
      const limit = 5;
      const windowMs = 60000;

      for (let i = 0; i < limit; i++) {
        rateLimiter.check('user-1', limit, windowMs);
      }

      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(false);
    });

    it('should track different keys independently', () => {
      const limit = 2;
      const windowMs = 60000;

      rateLimiter.check('user-1', limit, windowMs);
      rateLimiter.check('user-1', limit, windowMs);
      
      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(false);
      expect(rateLimiter.check('user-2', limit, windowMs)).toBe(true);
    });
  });

  describe('Time Window Behavior', () => {
    it('should reset count after window expires', () => {
      const limit = 3;
      const windowMs = 60000;

      for (let i = 0; i < limit; i++) {
        rateLimiter.check('user-1', limit, windowMs);
      }

      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(false);

      vi.advanceTimersByTime(windowMs + 1);

      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(true);
    });

    it('should start new window on first request after expiry', () => {
      const limit = 2;
      const windowMs = 10000;

      rateLimiter.check('user-1', limit, windowMs);
      
      vi.advanceTimersByTime(windowMs + 1);
      
      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(true);
      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(true);
      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(false);
    });
  });

  describe('Brute Force Simulation', () => {
    it('should protect against auth brute force (5 requests/60s)', () => {
      const authLimit = 5;
      const authWindowMs = 60000;
      const attackerIp = '192.168.1.100';

      let blocked = 0;
      let allowed = 0;

      for (let attempt = 0; attempt < 100; attempt++) {
        if (rateLimiter.check(attackerIp, authLimit, authWindowMs)) {
          allowed++;
        } else {
          blocked++;
        }
      }

      expect(allowed).toBe(authLimit);
      expect(blocked).toBe(95);
    });

    it('should protect against chat spam (5 messages/10s)', () => {
      const chatLimit = 5;
      const chatWindowMs = 10000;
      const spammerId = 'spammer-user';

      let blocked = 0;

      for (let i = 0; i < 20; i++) {
        if (!rateLimiter.check(spammerId, chatLimit, chatWindowMs)) {
          blocked++;
        }
      }

      expect(blocked).toBe(15);
    });

    it('should allow legitimate usage pattern', () => {
      const limit = 5;
      const windowMs = 60000;
      const userId = 'legitimate-user';

      for (let minute = 0; minute < 5; minute++) {
        for (let i = 0; i < limit; i++) {
          expect(rateLimiter.check(userId, limit, windowMs)).toBe(true);
        }
        vi.advanceTimersByTime(windowMs + 1);
      }
    });
  });

  describe('Memory Management', () => {
    it('should cleanup expired entries', () => {
      const windowMs = 10000;

      rateLimiter.check('user-1', 5, windowMs);
      rateLimiter.check('user-2', 5, windowMs);
      rateLimiter.check('user-3', 5, windowMs);

      expect(rateLimiter.getRecordCount()).toBe(3);

      vi.advanceTimersByTime(windowMs + 1);
      rateLimiter.cleanup();

      expect(rateLimiter.getRecordCount()).toBe(0);
    });

    it('should only cleanup expired entries', () => {
      const windowMs = 10000;

      rateLimiter.check('user-1', 5, windowMs);
      
      vi.advanceTimersByTime(windowMs / 2);
      
      rateLimiter.check('user-2', 5, windowMs);

      vi.advanceTimersByTime(windowMs / 2 + 1);
      rateLimiter.cleanup();

      expect(rateLimiter.getRecordCount()).toBe(1);
    });
  });

  describe('Edge Cases', () => {
    it('should block second request when limit is one', () => {
      expect(rateLimiter.check('user-1', 1, 60000)).toBe(true);
      expect(rateLimiter.check('user-1', 1, 60000)).toBe(false);
    });

    it('should handle very short window', () => {
      const limit = 3;
      const windowMs = 1;

      rateLimiter.check('user-1', limit, windowMs);
      rateLimiter.check('user-1', limit, windowMs);
      rateLimiter.check('user-1', limit, windowMs);

      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(false);

      vi.advanceTimersByTime(2);

      expect(rateLimiter.check('user-1', limit, windowMs)).toBe(true);
    });

    it('should handle empty string key', () => {
      expect(rateLimiter.check('', 5, 60000)).toBe(true);
    });

    it('should handle special characters in key', () => {
      const key = 'user:123:192.168.1.1:auth';
      expect(rateLimiter.check(key, 5, 60000)).toBe(true);
    });
  });
});
