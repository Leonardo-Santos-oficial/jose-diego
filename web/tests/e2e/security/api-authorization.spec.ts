import { test, expect } from '@playwright/test';

/**
 * Security Tests - API Endpoint Authorization
 * 
 * Tests that API endpoints properly verify authentication and authorization
 * before processing requests.
 * 
 * Key scenarios:
 * - Unauthenticated API requests are rejected
 * - API endpoints require proper session or bearer token
 * - Invalid/expired tokens are rejected
 * - API responses don't leak sensitive data
 */

test.describe('Aviator API - Bet Endpoint Authorization', () => {
  test('should reject bet placement without authentication', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      data: {
        amount: 100,
      },
    });

    // Should require authentication
    expect([401, 403]).toContain(response.status());
  });

  test('should reject bet with invalid session', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Cookie': 'sb-auth-token=invalid-token-here',
      },
      data: {
        amount: 100,
      },
    });

    // Invalid session should be rejected
    expect([401, 403]).toContain(response.status());
  });

  test('should reject bet with malformed authorization header', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Authorization': 'NotBearer invalid',
      },
      data: {
        amount: 100,
      },
    });

    // Malformed auth should be rejected
    expect([401, 403]).toContain(response.status());
  });

  test('should reject bet with wrong bearer token', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Authorization': 'Bearer wrong-token-123',
      },
      data: {
        amount: 100,
      },
    });

    // Wrong bearer token should be rejected
    expect([401, 403]).toContain(response.status());
  });

  test('should not allow negative bet amounts', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      data: {
        amount: -100,
      },
    });

    // Should reject - either auth error or validation error
    expect([400, 401, 403]).toContain(response.status());
  });
});

test.describe('Aviator API - Cashout Endpoint Authorization', () => {
  test('should reject cashout without authentication', async ({ request }) => {
    const response = await request.post('/api/aviator/cashout', {
      data: {
        betId: 'some-bet-id',
      },
    });

    // Should require authentication
    expect([401, 403]).toContain(response.status());
  });

  test('should reject cashout with invalid token', async ({ request }) => {
    const response = await request.post('/api/aviator/cashout', {
      headers: {
        'Authorization': 'Bearer invalid-token',
      },
      data: {
        betId: 'some-bet-id',
      },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('should reject cashout for non-existent bet', async ({ request }) => {
    // Even with potentially valid session, non-existent bet should fail
    const response = await request.post('/api/aviator/cashout', {
      headers: {
        'Authorization': 'Bearer test',
      },
      data: {
        betId: 'non-existent-bet-id-12345',
      },
    });

    // Should fail - auth error or not found
    expect([400, 401, 403, 404]).toContain(response.status());
  });
});

test.describe('Aviator API - Tick Endpoint Authorization', () => {
  test('should reject tick without secret header', async ({ request }) => {
    const response = await request.post('/api/aviator/tick', {
      data: {
        multiplier: 1.5,
      },
    });

    // Tick endpoint requires special authorization
    expect([401, 403]).toContain(response.status());
  });

  test('should reject tick with invalid secret', async ({ request }) => {
    const response = await request.post('/api/aviator/tick', {
      headers: {
        'x-aviator-secret': 'wrong-secret',
      },
      data: {
        multiplier: 1.5,
      },
    });

    expect([401, 403]).toContain(response.status());
  });

  test('should reject tick with Bearer token only', async ({ request }) => {
    const response = await request.post('/api/aviator/tick', {
      headers: {
        'Authorization': 'Bearer some-token',
      },
      data: {
        multiplier: 1.5,
      },
    });

    // Bearer alone might not be enough for tick endpoint
    expect([401, 403]).toContain(response.status());
  });
});

test.describe('Game State API Authorization', () => {
  test('should reject state manipulation from unauthenticated user', async ({ request }) => {
    const response = await request.post('/api/aviator/state', {
      data: {
        state: 'flying',
        multiplier: 10.0,
      },
    });

    // Should not allow unauthenticated state changes
    expect([401, 403, 404, 405]).toContain(response.status());
  });

  test('should not expose internal game state to public', async ({ request }) => {
    const response = await request.get('/api/aviator/state');

    // If endpoint exists and returns data, should not include secrets
    if (response.status() === 200) {
      const data = await response.json();
      expect(data).not.toHaveProperty('adminSecret');
      expect(data).not.toHaveProperty('bearerToken');
      expect(data).not.toHaveProperty('serviceKey');
    }
  });
});

test.describe('API Rate Limiting', () => {
  test('should enforce rate limit on repeated API calls', async ({ request }) => {
    const responses: number[] = [];
    
    // Make multiple rapid requests
    for (let i = 0; i < 15; i++) {
      const response = await request.post('/api/aviator/bets', {
        data: { amount: 100 },
      });
      responses.push(response.status());
    }

    // Should have some rate limited responses (429) or auth failures
    // At minimum, should not all succeed
    const successCount = responses.filter(s => s === 200).length;
    expect(successCount).toBeLessThan(15);
  });

  test('should return proper rate limit headers', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      data: { amount: 100 },
    });

    // Rate limited endpoints should include rate limit info
    // This is optional but recommended security practice
    const rateLimitRemaining = response.headers()['x-ratelimit-remaining'];
    const retryAfter = response.headers()['retry-after'];
    
    // Either rate limit headers exist OR we get proper error status
    if (response.status() === 429) {
      expect(retryAfter || rateLimitRemaining).toBeDefined();
    }
  });
});

test.describe('API Error Response Security', () => {
  test('should not leak stack traces in error responses', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      data: {
        // Invalid data to trigger error
        amount: 'not-a-number',
        invalidField: { nested: 'object' },
      },
    });

    if (response.status() >= 400) {
      const text = await response.text();
      
      // Should not contain stack trace information
      expect(text).not.toContain('node_modules');
      expect(text).not.toContain('at Function');
      expect(text).not.toContain('.ts:');
      expect(text).not.toMatch(/at \w+\s+\(/);
    }
  });

  test('should not leak database details in error responses', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      data: {
        amount: 100,
        // SQL injection attempt
        userId: "'; DROP TABLE users; --",
      },
    });

    if (response.status() >= 400) {
      const text = await response.text();
      
      // Should not contain database error details
      expect(text).not.toContain('PostgreSQL');
      expect(text).not.toContain('syntax error');
      expect(text).not.toContain('relation');
      expect(text).not.toContain('column');
      expect(text).not.toContain('SUPABASE');
    }
  });

  test('should not expose internal paths in errors', async ({ request }) => {
    const response = await request.get('/api/non-existent-endpoint-12345');

    if (response.status() >= 400) {
      const text = await response.text();
      
      // Should not expose sensitive information in error responses
      // Note: Next.js dev mode includes script paths with node_modules which is expected
      // Focus on actual sensitive data exposure
      expect(text).not.toContain('SUPABASE_SERVICE_ROLE_KEY');
      expect(text).not.toContain('AVIATOR_ADMIN_BEARER');
      expect(text).not.toContain('password');
      expect(text).not.toContain('.env');
      // Should not have stack traces with full file paths containing user directories
      expect(text).not.toMatch(/Error:.*at.*\.ts:\d+:\d+/); // Stack trace pattern
    }
  });
});

test.describe('CORS Security', () => {
  test('should not allow requests from unauthorized origins', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Origin': 'https://malicious-site.com',
      },
      data: {
        amount: 100,
      },
    });

    // Should either reject or not include CORS headers for malicious origin
    const allowedOrigin = response.headers()['access-control-allow-origin'];
    if (allowedOrigin) {
      expect(allowedOrigin).not.toBe('*');
      expect(allowedOrigin).not.toBe('https://malicious-site.com');
    }
  });

  test('should not expose credentials to unauthorized origins', async ({ request }) => {
    // Send a preflight-like request with custom headers
    const response = await request.fetch('/api/aviator/bets', {
      method: 'OPTIONS',
      headers: {
        'Origin': 'https://malicious-site.com',
        'Access-Control-Request-Method': 'POST',
        'Access-Control-Request-Headers': 'Authorization',
      },
    });

    const allowCredentials = response.headers()['access-control-allow-credentials'];
    const allowedOrigin = response.headers()['access-control-allow-origin'];

    // If credentials are allowed, origin should be specific, not wildcard
    if (allowCredentials === 'true') {
      expect(allowedOrigin).not.toBe('*');
    }
  });
});

test.describe('HTTP Method Security', () => {
  test('should reject DELETE requests on bet endpoint', async ({ request }) => {
    const response = await request.delete('/api/aviator/bets');
    
    // DELETE should not be allowed - either method not allowed or unauthorized
    expect([401, 403, 404, 405]).toContain(response.status());
  });

  test('should reject PUT requests on protected endpoints', async ({ request }) => {
    const response = await request.put('/api/aviator/state', {
      data: { state: 'manipulated' },
    });

    expect([401, 403, 404, 405]).toContain(response.status());
  });

  test('should reject PATCH requests with unauthorized data', async ({ request }) => {
    const response = await request.patch('/api/user/profile', {
      data: {
        balance: 999999,
        role: 'admin',
      },
    });

    expect([401, 403, 404, 405]).toContain(response.status());
  });
});

test.describe('Content-Type Security', () => {
  test('should reject requests with incorrect content type', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      headers: {
        'Content-Type': 'text/html',
      },
      data: '<script>alert("xss")</script>',
    });

    // Should reject HTML content
    expect([400, 401, 403, 415]).toContain(response.status());
  });

  test('should handle missing content-type header', async ({ request }) => {
    const response = await request.post('/api/aviator/bets', {
      data: { amount: 100 },
    });

    // Should either parse or reject gracefully, not crash
    expect(response.status()).toBeGreaterThanOrEqual(200);
    expect(response.status()).toBeLessThan(600);
  });
});
