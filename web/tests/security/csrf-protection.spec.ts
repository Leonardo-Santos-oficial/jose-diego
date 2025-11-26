import { describe, it, expect } from 'vitest';

/**
 * Security Tests - CSRF (Cross-Site Request Forgery) Protection
 * 
 * Unit tests for CSRF token generation, validation, and protection mechanisms
 */

// CSRF Token Generator
function generateCsrfToken(length: number = 32): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let token = '';
  for (let i = 0; i < length; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
}

// CSRF Token Validator
function validateCsrfToken(sessionToken: string | null, requestToken: string | null): boolean {
  if (!sessionToken || !requestToken) {
    return false;
  }
  
  if (sessionToken.length !== requestToken.length) {
    return false;
  }
  
  // Constant-time comparison
  let result = 0;
  for (let i = 0; i < sessionToken.length; i++) {
    result |= sessionToken.charCodeAt(i) ^ requestToken.charCodeAt(i);
  }
  
  return result === 0;
}

// Double Submit Cookie Validator
interface DoubleSubmitConfig {
  cookieToken: string | null;
  headerToken: string | null;
  bodyToken?: string | null;
}

function validateDoubleSubmit(config: DoubleSubmitConfig): boolean {
  const { cookieToken, headerToken, bodyToken } = config;
  
  if (!cookieToken) {
    return false;
  }
  
  // Header token takes precedence
  const requestToken = headerToken || bodyToken;
  
  if (!requestToken) {
    return false;
  }
  
  return validateCsrfToken(cookieToken, requestToken);
}

// Origin/Referer Validation
function validateOrigin(
  requestOrigin: string | null,
  requestReferer: string | null,
  allowedOrigins: string[]
): { valid: boolean; reason?: string } {
  // Prefer Origin header
  if (requestOrigin) {
    const isAllowed = allowedOrigins.some(allowed => {
      if (allowed === '*') return true;
      return requestOrigin === allowed;
    });
    return isAllowed 
      ? { valid: true } 
      : { valid: false, reason: 'Origin not allowed' };
  }
  
  // Fall back to Referer
  if (requestReferer) {
    try {
      const refererOrigin = new URL(requestReferer).origin;
      const isAllowed = allowedOrigins.some(allowed => {
        if (allowed === '*') return true;
        return refererOrigin === allowed;
      });
      return isAllowed 
        ? { valid: true } 
        : { valid: false, reason: 'Referer origin not allowed' };
    } catch {
      return { valid: false, reason: 'Invalid Referer URL' };
    }
  }
  
  return { valid: false, reason: 'No Origin or Referer header' };
}

// SameSite Cookie Policy
type SameSiteSetting = 'Strict' | 'Lax' | 'None';

function validateSameSiteSetting(
  sameSite: SameSiteSetting,
  secure: boolean,
  requestMethod: string,
  isTopLevelNavigation: boolean
): boolean {
  switch (sameSite) {
    case 'Strict':
      // Only sent with same-site requests
      return true; // Browser handles this
    case 'Lax':
      // Sent with same-site and top-level navigation GET
      if (isTopLevelNavigation && requestMethod === 'GET') {
        return true;
      }
      return true; // Browser handles cross-site blocking
    case 'None':
      // Must be Secure
      return secure;
    default:
      return false;
  }
}

describe('CSRF Token Generation', () => {
  it('should generate token of specified length', () => {
    expect(generateCsrfToken(32).length).toBe(32);
    expect(generateCsrfToken(64).length).toBe(64);
    expect(generateCsrfToken(16).length).toBe(16);
  });

  it('should generate unique tokens', () => {
    const tokens = new Set<string>();
    for (let i = 0; i < 100; i++) {
      tokens.add(generateCsrfToken(32));
    }
    expect(tokens.size).toBe(100);
  });

  it('should only contain alphanumeric characters', () => {
    const token = generateCsrfToken(100);
    expect(/^[A-Za-z0-9]+$/.test(token)).toBe(true);
  });

  it('should generate cryptographically sufficient length', () => {
    const token = generateCsrfToken();
    expect(token.length).toBeGreaterThanOrEqual(32);
  });
});

describe('CSRF Token Validation', () => {
  describe('Valid Tokens', () => {
    it('should accept matching tokens', () => {
      const token = 'abc123def456';
      expect(validateCsrfToken(token, token)).toBe(true);
    });

    it('should accept generated tokens', () => {
      const token = generateCsrfToken(32);
      expect(validateCsrfToken(token, token)).toBe(true);
    });
  });

  describe('Invalid Tokens', () => {
    it('should reject null session token', () => {
      expect(validateCsrfToken(null, 'token')).toBe(false);
    });

    it('should reject null request token', () => {
      expect(validateCsrfToken('token', null)).toBe(false);
    });

    it('should reject both null', () => {
      expect(validateCsrfToken(null, null)).toBe(false);
    });

    it('should reject mismatched tokens', () => {
      expect(validateCsrfToken('token1', 'token2')).toBe(false);
    });

    it('should reject different length tokens', () => {
      expect(validateCsrfToken('short', 'longertoken')).toBe(false);
    });

    it('should reject empty strings', () => {
      expect(validateCsrfToken('', '')).toBe(false);
    });

    it('should reject one empty string', () => {
      expect(validateCsrfToken('token', '')).toBe(false);
      expect(validateCsrfToken('', 'token')).toBe(false);
    });
  });

  describe('Timing Attack Prevention', () => {
    it('should use constant-time comparison', () => {
      const token = 'a'.repeat(1000);
      const wrongFirst = 'b' + 'a'.repeat(999);
      const wrongLast = 'a'.repeat(999) + 'b';
      
      // Both should fail regardless of where difference is
      expect(validateCsrfToken(token, wrongFirst)).toBe(false);
      expect(validateCsrfToken(token, wrongLast)).toBe(false);
    });
  });
});

describe('Double Submit Cookie Validation', () => {
  it('should accept matching cookie and header tokens', () => {
    expect(validateDoubleSubmit({
      cookieToken: 'csrf_token_123',
      headerToken: 'csrf_token_123',
    })).toBe(true);
  });

  it('should accept matching cookie and body tokens', () => {
    expect(validateDoubleSubmit({
      cookieToken: 'csrf_token_123',
      headerToken: null,
      bodyToken: 'csrf_token_123',
    })).toBe(true);
  });

  it('should prefer header over body token', () => {
    expect(validateDoubleSubmit({
      cookieToken: 'csrf_token_123',
      headerToken: 'csrf_token_123',
      bodyToken: 'wrong_token',
    })).toBe(true);
  });

  it('should reject missing cookie token', () => {
    expect(validateDoubleSubmit({
      cookieToken: null,
      headerToken: 'csrf_token_123',
    })).toBe(false);
  });

  it('should reject missing request token', () => {
    expect(validateDoubleSubmit({
      cookieToken: 'csrf_token_123',
      headerToken: null,
      bodyToken: null,
    })).toBe(false);
  });

  it('should reject mismatched tokens', () => {
    expect(validateDoubleSubmit({
      cookieToken: 'csrf_token_123',
      headerToken: 'csrf_token_456',
    })).toBe(false);
  });
});

describe('Origin/Referer Validation', () => {
  const allowedOrigins = ['https://example.com', 'https://app.example.com'];

  describe('Origin Header', () => {
    it('should accept allowed origin', () => {
      const result = validateOrigin('https://example.com', null, allowedOrigins);
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed origin', () => {
      const result = validateOrigin('https://attacker.com', null, allowedOrigins);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Origin not allowed');
    });

    it('should accept wildcard origin', () => {
      const result = validateOrigin('https://any.com', null, ['*']);
      expect(result.valid).toBe(true);
    });
  });

  describe('Referer Header', () => {
    it('should accept allowed referer', () => {
      const result = validateOrigin(null, 'https://example.com/path', allowedOrigins);
      expect(result.valid).toBe(true);
    });

    it('should reject disallowed referer', () => {
      const result = validateOrigin(null, 'https://attacker.com/path', allowedOrigins);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Referer origin not allowed');
    });

    it('should reject invalid referer URL', () => {
      const result = validateOrigin(null, 'not-a-valid-url', allowedOrigins);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('Invalid Referer URL');
    });
  });

  describe('Missing Headers', () => {
    it('should reject when both headers missing', () => {
      const result = validateOrigin(null, null, allowedOrigins);
      expect(result.valid).toBe(false);
      expect(result.reason).toBe('No Origin or Referer header');
    });
  });

  describe('Origin Precedence', () => {
    it('should prefer Origin over Referer', () => {
      const result = validateOrigin(
        'https://example.com',
        'https://attacker.com/path',
        allowedOrigins
      );
      expect(result.valid).toBe(true);
    });
  });
});

describe('SameSite Cookie Policy', () => {
  describe('Strict Mode', () => {
    it('should be valid for same-site requests', () => {
      expect(validateSameSiteSetting('Strict', true, 'POST', false)).toBe(true);
      expect(validateSameSiteSetting('Strict', true, 'GET', true)).toBe(true);
    });
  });

  describe('Lax Mode', () => {
    it('should be valid for top-level GET navigation', () => {
      expect(validateSameSiteSetting('Lax', true, 'GET', true)).toBe(true);
    });

    it('should be valid for same-site POST', () => {
      expect(validateSameSiteSetting('Lax', true, 'POST', false)).toBe(true);
    });
  });

  describe('None Mode', () => {
    it('should require Secure flag', () => {
      expect(validateSameSiteSetting('None', true, 'GET', false)).toBe(true);
      expect(validateSameSiteSetting('None', false, 'GET', false)).toBe(false);
    });
  });
});

describe('CSRF Attack Scenarios', () => {
  interface MockRequest {
    method: string;
    origin?: string;
    referer?: string;
    csrfHeader?: string;
    csrfCookie?: string;
    csrfBody?: string;
  }

  interface SessionStore {
    csrfToken: string;
  }

  function validateRequest(request: MockRequest, session: SessionStore): boolean {
    // State-changing methods require CSRF protection
    if (['POST', 'PUT', 'DELETE', 'PATCH'].includes(request.method)) {
      // Validate double submit
      if (!validateDoubleSubmit({
        cookieToken: request.csrfCookie || null,
        headerToken: request.csrfHeader || null,
        bodyToken: request.csrfBody || null,
      })) {
        return false;
      }
      
      // Validate origin
      const originResult = validateOrigin(
        request.origin || null,
        request.referer || null,
        ['https://example.com']
      );
      
      if (!originResult.valid) {
        return false;
      }
    }
    
    return true;
  }

  const validSession: SessionStore = { csrfToken: 'valid_csrf_token' };

  it('should accept valid POST request', () => {
    const request: MockRequest = {
      method: 'POST',
      origin: 'https://example.com',
      csrfCookie: 'valid_csrf_token',
      csrfHeader: 'valid_csrf_token',
    };
    expect(validateRequest(request, validSession)).toBe(true);
  });

  it('should reject POST without CSRF token', () => {
    const request: MockRequest = {
      method: 'POST',
      origin: 'https://example.com',
    };
    expect(validateRequest(request, validSession)).toBe(false);
  });

  it('should reject POST from wrong origin', () => {
    const request: MockRequest = {
      method: 'POST',
      origin: 'https://attacker.com',
      csrfCookie: 'valid_csrf_token',
      csrfHeader: 'valid_csrf_token',
    };
    expect(validateRequest(request, validSession)).toBe(false);
  });

  it('should reject POST with mismatched tokens', () => {
    const request: MockRequest = {
      method: 'POST',
      origin: 'https://example.com',
      csrfCookie: 'valid_csrf_token',
      csrfHeader: 'attacker_token',
    };
    expect(validateRequest(request, validSession)).toBe(false);
  });

  it('should allow GET requests without CSRF', () => {
    const request: MockRequest = {
      method: 'GET',
      origin: 'https://attacker.com',
    };
    expect(validateRequest(request, validSession)).toBe(true);
  });

  it('should require CSRF for DELETE requests', () => {
    const request: MockRequest = {
      method: 'DELETE',
      origin: 'https://example.com',
    };
    expect(validateRequest(request, validSession)).toBe(false);
  });

  it('should require CSRF for PUT requests', () => {
    const request: MockRequest = {
      method: 'PUT',
      origin: 'https://example.com',
    };
    expect(validateRequest(request, validSession)).toBe(false);
  });

  it('should require CSRF for PATCH requests', () => {
    const request: MockRequest = {
      method: 'PATCH',
      origin: 'https://example.com',
    };
    expect(validateRequest(request, validSession)).toBe(false);
  });
});
