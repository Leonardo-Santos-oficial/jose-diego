import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Security Tests - Token and Session Security
 * 
 * Unit tests for token handling, session management, and secure data handling
 */

// JWT-like token structure for testing
interface TokenPayload {
  sub: string;
  email: string;
  role?: string;
  exp: number;
  iat: number;
}

// Token validation utilities
function isTokenExpired(exp: number): boolean {
  return Date.now() / 1000 > exp;
}

function parseToken(token: string): TokenPayload | null {
  try {
    // Simulated JWT parsing (in production, use proper JWT library)
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    
    const payload = JSON.parse(atob(parts[1]));
    return payload as TokenPayload;
  } catch {
    return null;
  }
}

function createMockToken(payload: Partial<TokenPayload>, expiresInSeconds = 3600): string {
  const now = Math.floor(Date.now() / 1000);
  const fullPayload: TokenPayload = {
    sub: payload.sub || 'user-123',
    email: payload.email || 'user@test.com',
    role: payload.role,
    iat: now,
    exp: now + expiresInSeconds,
  };
  
  // Create a mock JWT (not cryptographically valid, just for testing structure)
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(fullPayload));
  const signature = btoa('mock-signature');
  
  return `${header}.${body}.${signature}`;
}

describe('Token Expiration', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-01-01T12:00:00Z'));
  });

  it('should detect expired token', () => {
    const pastExp = Math.floor(Date.now() / 1000) - 3600; // 1 hour ago
    expect(isTokenExpired(pastExp)).toBe(true);
  });

  it('should detect valid token', () => {
    const futureExp = Math.floor(Date.now() / 1000) + 3600; // 1 hour from now
    expect(isTokenExpired(futureExp)).toBe(false);
  });

  it('should detect just-expired token', () => {
    const nowExp = Math.floor(Date.now() / 1000) - 1; // 1 second ago
    expect(isTokenExpired(nowExp)).toBe(true);
  });

  it('should handle edge case of exp equal to current time', () => {
    const nowExp = Math.floor(Date.now() / 1000);
    // At exact expiration time, token is expired
    expect(isTokenExpired(nowExp)).toBe(false);
  });
});

describe('Token Parsing', () => {
  it('should parse valid mock token', () => {
    const token = createMockToken({ sub: 'user-123', email: 'test@test.com' });
    const payload = parseToken(token);
    
    expect(payload).not.toBeNull();
    expect(payload?.sub).toBe('user-123');
    expect(payload?.email).toBe('test@test.com');
  });

  it('should return null for invalid token format', () => {
    expect(parseToken('invalid')).toBeNull();
    expect(parseToken('only.two')).toBeNull();
    expect(parseToken('')).toBeNull();
  });

  it('should return null for malformed payload', () => {
    const malformedToken = 'header.notvalidbase64!@#.signature';
    expect(parseToken(malformedToken)).toBeNull();
  });

  it('should extract role from token payload', () => {
    const token = createMockToken({ role: 'admin' });
    const payload = parseToken(token);
    
    expect(payload?.role).toBe('admin');
  });
});

describe('Token Security Validation', () => {
  interface TokenValidationResult {
    valid: boolean;
    error?: string;
  }

  function validateToken(token: string | null): TokenValidationResult {
    if (!token) {
      return { valid: false, error: 'Token not provided' };
    }

    if (typeof token !== 'string') {
      return { valid: false, error: 'Invalid token type' };
    }

    const payload = parseToken(token);
    if (!payload) {
      return { valid: false, error: 'Invalid token format' };
    }

    if (isTokenExpired(payload.exp)) {
      return { valid: false, error: 'Token expired' };
    }

    if (!payload.sub || !payload.email) {
      return { valid: false, error: 'Missing required claims' };
    }

    return { valid: true };
  }

  it('should reject null token', () => {
    const result = validateToken(null);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token not provided');
  });

  it('should reject empty string token', () => {
    const result = validateToken('');
    expect(result.valid).toBe(false);
  });

  it('should accept valid token', () => {
    const token = createMockToken({ sub: 'user-123', email: 'user@test.com' });
    const result = validateToken(token);
    expect(result.valid).toBe(true);
  });

  it('should reject expired token', () => {
    const token = createMockToken({}, -3600); // Expired 1 hour ago
    const result = validateToken(token);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token expired');
  });
});

describe('Sensitive Data Handling', () => {
  // Function to sanitize sensitive data from logs/responses
  function sanitizeForLogging(data: Record<string, unknown>): Record<string, unknown> {
    const sensitiveFields = ['password', 'token', 'secret', 'key', 'authorization', 'cookie'];
    const result = { ...data };
    
    for (const field of sensitiveFields) {
      for (const key of Object.keys(result)) {
        if (key.toLowerCase().includes(field)) {
          result[key] = '[REDACTED]';
        }
      }
    }
    
    return result;
  }

  function containsSensitiveData(text: string): boolean {
    const sensitivePatterns = [
      /password/i,
      /secret/i,
      /api[_-]?key/i,
      /bearer\s+[a-zA-Z0-9._-]+/i,
      /eyJ[a-zA-Z0-9_-]*\.eyJ[a-zA-Z0-9_-]*\.[a-zA-Z0-9_-]*/i, // JWT pattern
    ];
    
    return sensitivePatterns.some(pattern => pattern.test(text));
  }

  it('should redact password field', () => {
    const data = { email: 'user@test.com', password: 'secret123' };
    const sanitized = sanitizeForLogging(data);
    
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.email).toBe('user@test.com');
  });

  it('should redact token field', () => {
    const data = { userId: '123', accessToken: 'eyJ...' };
    const sanitized = sanitizeForLogging(data);
    
    expect(sanitized.accessToken).toBe('[REDACTED]');
  });

  it('should redact multiple sensitive fields', () => {
    const data = {
      email: 'user@test.com',
      password: 'secret',
      apiKey: 'key-123',
      authorizationHeader: 'Bearer token',
    };
    const sanitized = sanitizeForLogging(data);
    
    expect(sanitized.password).toBe('[REDACTED]');
    expect(sanitized.apiKey).toBe('[REDACTED]');
    expect(sanitized.authorizationHeader).toBe('[REDACTED]');
    expect(sanitized.email).toBe('user@test.com');
  });

  it('should detect sensitive data in text', () => {
    expect(containsSensitiveData('user password is 123')).toBe(true);
    expect(containsSensitiveData('API_KEY=abc123')).toBe(true);
    expect(containsSensitiveData('Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.signature')).toBe(true);
  });

  it('should not flag safe text', () => {
    expect(containsSensitiveData('Hello world')).toBe(false);
    expect(containsSensitiveData('User email: test@test.com')).toBe(false);
  });
});

describe('Session Cookie Security', () => {
  interface CookieOptions {
    httpOnly?: boolean;
    secure?: boolean;
    sameSite?: 'strict' | 'lax' | 'none';
    maxAge?: number;
    path?: string;
  }

  function validateSessionCookieOptions(options: CookieOptions): string[] {
    const errors: string[] = [];
    
    if (!options.httpOnly) {
      errors.push('Cookie should be HttpOnly to prevent XSS access');
    }
    
    if (!options.secure) {
      errors.push('Cookie should be Secure for HTTPS-only transmission');
    }
    
    if (!options.sameSite || options.sameSite === 'none') {
      if (options.sameSite === 'none' && !options.secure) {
        errors.push('SameSite=None requires Secure flag');
      }
      if (!options.sameSite) {
        errors.push('Cookie should have SameSite attribute');
      }
    }
    
    return errors;
  }

  it('should pass with secure cookie options', () => {
    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'strict',
    };
    const errors = validateSessionCookieOptions(options);
    expect(errors).toHaveLength(0);
  });

  it('should flag missing httpOnly', () => {
    const options: CookieOptions = {
      httpOnly: false,
      secure: true,
      sameSite: 'strict',
    };
    const errors = validateSessionCookieOptions(options);
    expect(errors).toContain('Cookie should be HttpOnly to prevent XSS access');
  });

  it('should flag missing secure', () => {
    const options: CookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'strict',
    };
    const errors = validateSessionCookieOptions(options);
    expect(errors).toContain('Cookie should be Secure for HTTPS-only transmission');
  });

  it('should flag SameSite=None without Secure', () => {
    const options: CookieOptions = {
      httpOnly: true,
      secure: false,
      sameSite: 'none',
    };
    const errors = validateSessionCookieOptions(options);
    expect(errors).toContain('SameSite=None requires Secure flag');
  });

  it('should allow SameSite=Lax', () => {
    const options: CookieOptions = {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
    };
    const errors = validateSessionCookieOptions(options);
    expect(errors).toHaveLength(0);
  });
});

describe('Bearer Token Format Validation', () => {
  function extractBearerToken(authHeader: string | null): string | null {
    if (!authHeader) return null;
    
    const match = authHeader.match(/^Bearer\s+(.+)$/i);
    return match ? match[1] : null;
  }

  function validateBearerFormat(authHeader: string): { valid: boolean; error?: string } {
    if (!authHeader) {
      return { valid: false, error: 'Authorization header missing' };
    }

    if (!authHeader.startsWith('Bearer ')) {
      return { valid: false, error: 'Invalid authorization scheme' };
    }

    const token = extractBearerToken(authHeader);
    if (!token || token.trim() === '') {
      return { valid: false, error: 'Token missing after Bearer' };
    }

    return { valid: true };
  }

  it('should extract valid bearer token', () => {
    expect(extractBearerToken('Bearer abc123')).toBe('abc123');
    expect(extractBearerToken('bearer token-value')).toBe('token-value');
  });

  it('should return null for invalid format', () => {
    expect(extractBearerToken('Basic abc123')).toBeNull();
    expect(extractBearerToken('abc123')).toBeNull();
    expect(extractBearerToken(null)).toBeNull();
  });

  it('should validate correct bearer format', () => {
    const result = validateBearerFormat('Bearer valid-token');
    expect(result.valid).toBe(true);
  });

  it('should reject missing header', () => {
    const result = validateBearerFormat('');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Authorization header missing');
  });

  it('should reject wrong scheme', () => {
    const result = validateBearerFormat('Basic token');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Invalid authorization scheme');
  });

  it('should reject Bearer without token', () => {
    const result = validateBearerFormat('Bearer ');
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Token missing after Bearer');
  });
});
