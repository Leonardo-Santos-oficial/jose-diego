import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

/**
 * Security Tests - API Security
 * 
 * Unit tests for API request validation, CORS, and security headers
 */

interface RequestHeaders {
  [key: string]: string | undefined;
}

interface SecurityHeadersConfig {
  contentSecurityPolicy?: string;
  xContentTypeOptions?: 'nosniff';
  xFrameOptions?: 'DENY' | 'SAMEORIGIN';
  xXssProtection?: '0' | '1' | '1; mode=block';
  strictTransportSecurity?: string;
  referrerPolicy?: string;
}

// CORS configuration
interface CorsConfig {
  allowedOrigins: string[];
  allowedMethods: string[];
  allowedHeaders: string[];
  allowCredentials: boolean;
  maxAge?: number;
}

const DEFAULT_CORS_CONFIG: CorsConfig = {
  allowedOrigins: ['http://localhost:3000', 'https://aviator-demo.example.com'],
  allowedMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  allowCredentials: true,
  maxAge: 86400,
};

function validateOrigin(origin: string | undefined, config: CorsConfig): boolean {
  if (!origin) return false;
  
  // Never allow wildcard with credentials
  if (config.allowCredentials && config.allowedOrigins.includes('*')) {
    return false;
  }
  
  return config.allowedOrigins.includes(origin);
}

function getCorsHeaders(origin: string | undefined, config: CorsConfig): Record<string, string> {
  const headers: Record<string, string> = {};
  
  if (validateOrigin(origin, config)) {
    headers['Access-Control-Allow-Origin'] = origin!;
    headers['Access-Control-Allow-Methods'] = config.allowedMethods.join(', ');
    headers['Access-Control-Allow-Headers'] = config.allowedHeaders.join(', ');
    
    if (config.allowCredentials) {
      headers['Access-Control-Allow-Credentials'] = 'true';
    }
    
    if (config.maxAge) {
      headers['Access-Control-Max-Age'] = config.maxAge.toString();
    }
  }
  
  return headers;
}

describe('CORS Validation', () => {
  describe('Origin Validation', () => {
    it('should allow configured origins', () => {
      expect(validateOrigin('http://localhost:3000', DEFAULT_CORS_CONFIG)).toBe(true);
      expect(validateOrigin('https://aviator-demo.example.com', DEFAULT_CORS_CONFIG)).toBe(true);
    });

    it('should reject unknown origins', () => {
      expect(validateOrigin('https://malicious-site.com', DEFAULT_CORS_CONFIG)).toBe(false);
      expect(validateOrigin('http://attacker.com', DEFAULT_CORS_CONFIG)).toBe(false);
    });

    it('should reject undefined origin', () => {
      expect(validateOrigin(undefined, DEFAULT_CORS_CONFIG)).toBe(false);
    });

    it('should reject empty origin', () => {
      expect(validateOrigin('', DEFAULT_CORS_CONFIG)).toBe(false);
    });

    it('should reject wildcard with credentials', () => {
      const unsafeConfig: CorsConfig = {
        ...DEFAULT_CORS_CONFIG,
        allowedOrigins: ['*'],
        allowCredentials: true,
      };
      expect(validateOrigin('http://any-site.com', unsafeConfig)).toBe(false);
    });
  });

  describe('CORS Headers Generation', () => {
    it('should return headers for valid origin', () => {
      const headers = getCorsHeaders('http://localhost:3000', DEFAULT_CORS_CONFIG);
      
      expect(headers['Access-Control-Allow-Origin']).toBe('http://localhost:3000');
      expect(headers['Access-Control-Allow-Credentials']).toBe('true');
    });

    it('should return empty headers for invalid origin', () => {
      const headers = getCorsHeaders('https://malicious.com', DEFAULT_CORS_CONFIG);
      
      expect(Object.keys(headers)).toHaveLength(0);
    });

    it('should include all allowed methods', () => {
      const headers = getCorsHeaders('http://localhost:3000', DEFAULT_CORS_CONFIG);
      
      expect(headers['Access-Control-Allow-Methods']).toContain('GET');
      expect(headers['Access-Control-Allow-Methods']).toContain('POST');
    });
  });
});

describe('Security Headers', () => {
  function generateSecurityHeaders(config: SecurityHeadersConfig): Record<string, string> {
    const headers: Record<string, string> = {};
    
    if (config.contentSecurityPolicy) {
      headers['Content-Security-Policy'] = config.contentSecurityPolicy;
    }
    
    if (config.xContentTypeOptions) {
      headers['X-Content-Type-Options'] = config.xContentTypeOptions;
    }
    
    if (config.xFrameOptions) {
      headers['X-Frame-Options'] = config.xFrameOptions;
    }
    
    if (config.xXssProtection) {
      headers['X-XSS-Protection'] = config.xXssProtection;
    }
    
    if (config.strictTransportSecurity) {
      headers['Strict-Transport-Security'] = config.strictTransportSecurity;
    }
    
    if (config.referrerPolicy) {
      headers['Referrer-Policy'] = config.referrerPolicy;
    }
    
    return headers;
  }

  function validateSecurityHeaders(headers: Record<string, string>): string[] {
    const issues: string[] = [];
    
    if (!headers['X-Content-Type-Options']) {
      issues.push('Missing X-Content-Type-Options header');
    }
    
    if (!headers['X-Frame-Options'] && !headers['Content-Security-Policy']?.includes('frame-ancestors')) {
      issues.push('Missing clickjacking protection');
    }
    
    if (!headers['Strict-Transport-Security']) {
      issues.push('Missing HSTS header');
    }
    
    return issues;
  }

  it('should generate all configured headers', () => {
    const config: SecurityHeadersConfig = {
      xContentTypeOptions: 'nosniff',
      xFrameOptions: 'DENY',
      xXssProtection: '1; mode=block',
      strictTransportSecurity: 'max-age=31536000; includeSubDomains',
      referrerPolicy: 'strict-origin-when-cross-origin',
    };
    
    const headers = generateSecurityHeaders(config);
    
    expect(headers['X-Content-Type-Options']).toBe('nosniff');
    expect(headers['X-Frame-Options']).toBe('DENY');
    expect(headers['X-XSS-Protection']).toBe('1; mode=block');
    expect(headers['Strict-Transport-Security']).toContain('max-age');
  });

  it('should identify missing security headers', () => {
    const incompleteHeaders = {
      'Content-Type': 'application/json',
    };
    
    const issues = validateSecurityHeaders(incompleteHeaders);
    
    expect(issues).toContain('Missing X-Content-Type-Options header');
    expect(issues).toContain('Missing clickjacking protection');
    expect(issues).toContain('Missing HSTS header');
  });

  it('should pass validation with all headers', () => {
    const completeHeaders = {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'Strict-Transport-Security': 'max-age=31536000',
    };
    
    const issues = validateSecurityHeaders(completeHeaders);
    expect(issues).toHaveLength(0);
  });
});

describe('Request Method Validation', () => {
  function isMethodAllowed(method: string, allowedMethods: string[]): boolean {
    return allowedMethods.includes(method.toUpperCase());
  }

  function validateRequestMethod(
    method: string,
    endpoint: string
  ): { allowed: boolean; error?: string } {
    const endpointMethods: Record<string, string[]> = {
      '/api/aviator/bets': ['POST'],
      '/api/aviator/cashout': ['POST'],
      '/api/aviator/tick': ['POST'],
      '/api/aviator/state': ['GET'],
      '/api/user/profile': ['GET', 'PUT'],
    };
    
    const allowedMethods = endpointMethods[endpoint];
    
    if (!allowedMethods) {
      return { allowed: false, error: 'Unknown endpoint' };
    }
    
    if (!isMethodAllowed(method, allowedMethods)) {
      return { allowed: false, error: `Method ${method} not allowed` };
    }
    
    return { allowed: true };
  }

  it('should allow POST on bet endpoint', () => {
    expect(validateRequestMethod('POST', '/api/aviator/bets').allowed).toBe(true);
  });

  it('should reject GET on bet endpoint', () => {
    const result = validateRequestMethod('GET', '/api/aviator/bets');
    expect(result.allowed).toBe(false);
    expect(result.error).toBe('Method GET not allowed');
  });

  it('should reject DELETE on all endpoints', () => {
    expect(validateRequestMethod('DELETE', '/api/aviator/bets').allowed).toBe(false);
    expect(validateRequestMethod('DELETE', '/api/user/profile').allowed).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(validateRequestMethod('post', '/api/aviator/bets').allowed).toBe(true);
    expect(validateRequestMethod('POST', '/api/aviator/bets').allowed).toBe(true);
  });
});

describe('Content-Type Validation', () => {
  function validateContentType(
    contentType: string | undefined,
    expectedTypes: string[]
  ): boolean {
    if (!contentType) return false;
    
    // Extract main type (ignore charset, boundary, etc.)
    const mainType = contentType.split(';')[0].trim().toLowerCase();
    
    return expectedTypes.some(expected => 
      expected.toLowerCase() === mainType
    );
  }

  it('should accept application/json', () => {
    expect(validateContentType('application/json', ['application/json'])).toBe(true);
  });

  it('should accept with charset', () => {
    expect(validateContentType('application/json; charset=utf-8', ['application/json'])).toBe(true);
  });

  it('should reject text/html for JSON endpoints', () => {
    expect(validateContentType('text/html', ['application/json'])).toBe(false);
  });

  it('should reject undefined content type', () => {
    expect(validateContentType(undefined, ['application/json'])).toBe(false);
  });

  it('should be case insensitive', () => {
    expect(validateContentType('Application/JSON', ['application/json'])).toBe(true);
  });
});

describe('Request Size Limits', () => {
  interface SizeLimitConfig {
    maxBodySize: number;
    maxHeaderSize: number;
    maxUrlLength: number;
  }

  const DEFAULT_LIMITS: SizeLimitConfig = {
    maxBodySize: 1024 * 1024, // 1MB
    maxHeaderSize: 8192,      // 8KB
    maxUrlLength: 2048,       // 2KB
  };

  function validateRequestSize(
    bodySize: number,
    headerSize: number,
    urlLength: number,
    limits: SizeLimitConfig = DEFAULT_LIMITS
  ): { valid: boolean; error?: string } {
    if (bodySize > limits.maxBodySize) {
      return { valid: false, error: 'Request body too large' };
    }
    
    if (headerSize > limits.maxHeaderSize) {
      return { valid: false, error: 'Headers too large' };
    }
    
    if (urlLength > limits.maxUrlLength) {
      return { valid: false, error: 'URL too long' };
    }
    
    return { valid: true };
  }

  it('should accept request within limits', () => {
    const result = validateRequestSize(1024, 512, 100);
    expect(result.valid).toBe(true);
  });

  it('should reject oversized body', () => {
    const result = validateRequestSize(2 * 1024 * 1024, 512, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Request body too large');
  });

  it('should reject oversized headers', () => {
    const result = validateRequestSize(1024, 16384, 100);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('Headers too large');
  });

  it('should reject long URL', () => {
    const result = validateRequestSize(1024, 512, 5000);
    expect(result.valid).toBe(false);
    expect(result.error).toBe('URL too long');
  });
});

describe('Rate Limit Header Validation', () => {
  interface RateLimitHeaders {
    limit: number;
    remaining: number;
    reset: number;
  }

  function generateRateLimitHeaders(
    limit: number,
    remaining: number,
    resetTimestamp: number
  ): Record<string, string> {
    return {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': resetTimestamp.toString(),
      'Retry-After': remaining <= 0 ? Math.ceil((resetTimestamp - Date.now()) / 1000).toString() : '',
    };
  }

  function parseRateLimitHeaders(headers: Record<string, string>): RateLimitHeaders | null {
    const limit = parseInt(headers['X-RateLimit-Limit']);
    const remaining = parseInt(headers['X-RateLimit-Remaining']);
    const reset = parseInt(headers['X-RateLimit-Reset']);
    
    if (isNaN(limit) || isNaN(remaining) || isNaN(reset)) {
      return null;
    }
    
    return { limit, remaining, reset };
  }

  it('should generate rate limit headers', () => {
    const headers = generateRateLimitHeaders(100, 50, Date.now() + 60000);
    
    expect(headers['X-RateLimit-Limit']).toBe('100');
    expect(headers['X-RateLimit-Remaining']).toBe('50');
    expect(headers['X-RateLimit-Reset']).toBeDefined();
  });

  it('should include Retry-After when rate limited', () => {
    const headers = generateRateLimitHeaders(100, 0, Date.now() + 60000);
    
    expect(headers['Retry-After']).not.toBe('');
    expect(parseInt(headers['Retry-After'])).toBeGreaterThan(0);
  });

  it('should parse rate limit headers', () => {
    const headers = {
      'X-RateLimit-Limit': '100',
      'X-RateLimit-Remaining': '50',
      'X-RateLimit-Reset': '1700000000000',
    };
    
    const parsed = parseRateLimitHeaders(headers);
    
    expect(parsed?.limit).toBe(100);
    expect(parsed?.remaining).toBe(50);
  });

  it('should return null for invalid headers', () => {
    const headers = {
      'X-RateLimit-Limit': 'invalid',
      'X-RateLimit-Remaining': '50',
      'X-RateLimit-Reset': '1700000000000',
    };
    
    expect(parseRateLimitHeaders(headers)).toBeNull();
  });
});
