import { describe, it, expect } from 'vitest';

/**
 * Security Tests - Input Validation
 * 
 * Comprehensive input validation tests for various data types
 */

// Email validation
function validateEmail(email: string): { valid: boolean; error?: string } {
  if (!email || typeof email !== 'string') {
    return { valid: false, error: 'Email is required' };
  }
  
  const trimmed = email.trim();
  
  if (trimmed.length === 0) {
    return { valid: false, error: 'Email is required' };
  }
  
  if (trimmed.length > 254) {
    return { valid: false, error: 'Email too long' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Invalid email format' };
  }
  
  // Check for dangerous characters
  if (/[<>'";\\\x00-\x1f]/.test(trimmed)) {
    return { valid: false, error: 'Email contains invalid characters' };
  }
  
  return { valid: true };
}

// Username validation
function validateUsername(username: string): { valid: boolean; error?: string } {
  if (!username || typeof username !== 'string') {
    return { valid: false, error: 'Username is required' };
  }
  
  const trimmed = username.trim();
  
  if (trimmed.length < 3) {
    return { valid: false, error: 'Username must be at least 3 characters' };
  }
  
  if (trimmed.length > 30) {
    return { valid: false, error: 'Username must be at most 30 characters' };
  }
  
  if (!/^[a-zA-Z0-9_]+$/.test(trimmed)) {
    return { valid: false, error: 'Username can only contain letters, numbers, and underscores' };
  }
  
  if (/^[0-9]/.test(trimmed)) {
    return { valid: false, error: 'Username cannot start with a number' };
  }
  
  return { valid: true };
}

// Phone number validation
function validatePhone(phone: string): { valid: boolean; error?: string } {
  if (!phone || typeof phone !== 'string') {
    return { valid: false, error: 'Phone is required' };
  }
  
  // Remove formatting characters
  const cleaned = phone.replace(/[\s\-\(\)\.]/g, '');
  
  if (!/^\+?[0-9]{10,15}$/.test(cleaned)) {
    return { valid: false, error: 'Invalid phone number format' };
  }
  
  return { valid: true };
}

// URL validation
function validateUrl(url: string): { valid: boolean; error?: string } {
  if (!url || typeof url !== 'string') {
    return { valid: false, error: 'URL is required' };
  }
  
  try {
    const parsed = new URL(url);
    
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return { valid: false, error: 'URL must use http or https protocol' };
    }
    
    return { valid: true };
  } catch {
    return { valid: false, error: 'Invalid URL format' };
  }
}

// Number validation
function validateNumber(
  value: unknown,
  options: { min?: number; max?: number; integer?: boolean } = {}
): { valid: boolean; error?: string; value?: number } {
  if (value === null || value === undefined) {
    return { valid: false, error: 'Invalid number' };
  }
  
  const num = Number(value);
  
  if (isNaN(num)) {
    return { valid: false, error: 'Invalid number' };
  }
  
  if (!isFinite(num)) {
    return { valid: false, error: 'Number must be finite' };
  }
  
  if (options.integer && !Number.isInteger(num)) {
    return { valid: false, error: 'Number must be an integer' };
  }
  
  if (options.min !== undefined && num < options.min) {
    return { valid: false, error: `Number must be at least ${options.min}` };
  }
  
  if (options.max !== undefined && num > options.max) {
    return { valid: false, error: `Number must be at most ${options.max}` };
  }
  
  return { valid: true, value: num };
}

// Date validation
function validateDate(date: string): { valid: boolean; error?: string; date?: Date } {
  if (!date || typeof date !== 'string') {
    return { valid: false, error: 'Date is required' };
  }
  
  const parsed = new Date(date);
  
  if (isNaN(parsed.getTime())) {
    return { valid: false, error: 'Invalid date format' };
  }
  
  // Check for reasonable date range (1900-2100)
  const year = parsed.getFullYear();
  if (year < 1900 || year > 2100) {
    return { valid: false, error: 'Date out of valid range' };
  }
  
  return { valid: true, date: parsed };
}

// JSON validation
function validateJson(json: string): { valid: boolean; error?: string; data?: unknown } {
  if (!json || typeof json !== 'string') {
    return { valid: false, error: 'JSON is required' };
  }
  
  try {
    const data = JSON.parse(json);
    return { valid: true, data };
  } catch (e) {
    return { valid: false, error: 'Invalid JSON format' };
  }
}

// UUID validation
function validateUuid(uuid: string): { valid: boolean; error?: string } {
  if (!uuid || typeof uuid !== 'string') {
    return { valid: false, error: 'UUID is required' };
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  
  if (!uuidRegex.test(uuid)) {
    return { valid: false, error: 'Invalid UUID format' };
  }
  
  return { valid: true };
}

describe('Email Validation', () => {
  describe('Valid Emails', () => {
    it('should accept standard email', () => {
      expect(validateEmail('user@example.com').valid).toBe(true);
    });

    it('should accept email with subdomain', () => {
      expect(validateEmail('user@mail.example.com').valid).toBe(true);
    });

    it('should accept email with plus', () => {
      expect(validateEmail('user+tag@example.com').valid).toBe(true);
    });

    it('should accept email with dots', () => {
      expect(validateEmail('first.last@example.com').valid).toBe(true);
    });

    it('should accept email with numbers', () => {
      expect(validateEmail('user123@example.com').valid).toBe(true);
    });
  });

  describe('Invalid Emails', () => {
    it('should reject empty email', () => {
      expect(validateEmail('').valid).toBe(false);
    });

    it('should reject email without @', () => {
      expect(validateEmail('userexample.com').valid).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(validateEmail('user@').valid).toBe(false);
    });

    it('should reject email without TLD', () => {
      expect(validateEmail('user@example').valid).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(validateEmail('user @example.com').valid).toBe(false);
    });

    it('should reject very long email', () => {
      const longEmail = 'a'.repeat(250) + '@example.com';
      expect(validateEmail(longEmail).valid).toBe(false);
    });
  });

  describe('Injection Prevention', () => {
    it('should reject email with script tags', () => {
      expect(validateEmail('<script>@example.com').valid).toBe(false);
    });

    it('should reject email with quotes', () => {
      expect(validateEmail("user'@example.com").valid).toBe(false);
      expect(validateEmail('user"@example.com').valid).toBe(false);
    });

    it('should reject email with null bytes', () => {
      expect(validateEmail('user\x00@example.com').valid).toBe(false);
    });
  });
});

describe('Username Validation', () => {
  describe('Valid Usernames', () => {
    it('should accept alphanumeric username', () => {
      expect(validateUsername('john123').valid).toBe(true);
    });

    it('should accept username with underscore', () => {
      expect(validateUsername('john_doe').valid).toBe(true);
    });

    it('should accept minimum length username', () => {
      expect(validateUsername('abc').valid).toBe(true);
    });
  });

  describe('Invalid Usernames', () => {
    it('should reject empty username', () => {
      expect(validateUsername('').valid).toBe(false);
    });

    it('should reject short username', () => {
      expect(validateUsername('ab').valid).toBe(false);
    });

    it('should reject long username', () => {
      expect(validateUsername('a'.repeat(31)).valid).toBe(false);
    });

    it('should reject username starting with number', () => {
      expect(validateUsername('1john').valid).toBe(false);
    });

    it('should reject username with special characters', () => {
      expect(validateUsername('john@doe').valid).toBe(false);
      expect(validateUsername('john-doe').valid).toBe(false);
      expect(validateUsername('john.doe').valid).toBe(false);
    });

    it('should reject username with spaces', () => {
      expect(validateUsername('john doe').valid).toBe(false);
    });
  });
});

describe('Phone Validation', () => {
  describe('Valid Phone Numbers', () => {
    it('should accept US format', () => {
      expect(validatePhone('1234567890').valid).toBe(true);
    });

    it('should accept with country code', () => {
      expect(validatePhone('+1234567890').valid).toBe(true);
    });

    it('should accept with formatting', () => {
      expect(validatePhone('(123) 456-7890').valid).toBe(true);
      expect(validatePhone('123-456-7890').valid).toBe(true);
      expect(validatePhone('123.456.7890').valid).toBe(true);
    });

    it('should accept international format', () => {
      expect(validatePhone('+55 11 98765-4321').valid).toBe(true);
    });
  });

  describe('Invalid Phone Numbers', () => {
    it('should reject empty phone', () => {
      expect(validatePhone('').valid).toBe(false);
    });

    it('should reject short phone', () => {
      expect(validatePhone('123456').valid).toBe(false);
    });

    it('should reject with letters', () => {
      expect(validatePhone('123-456-CALL').valid).toBe(false);
    });

    it('should reject too long phone', () => {
      expect(validatePhone('12345678901234567890').valid).toBe(false);
    });
  });
});

describe('URL Validation', () => {
  describe('Valid URLs', () => {
    it('should accept http URL', () => {
      expect(validateUrl('http://example.com').valid).toBe(true);
    });

    it('should accept https URL', () => {
      expect(validateUrl('https://example.com').valid).toBe(true);
    });

    it('should accept URL with path', () => {
      expect(validateUrl('https://example.com/path/to/page').valid).toBe(true);
    });

    it('should accept URL with query', () => {
      expect(validateUrl('https://example.com?foo=bar').valid).toBe(true);
    });

    it('should accept URL with port', () => {
      expect(validateUrl('https://example.com:8080').valid).toBe(true);
    });
  });

  describe('Invalid URLs', () => {
    it('should reject empty URL', () => {
      expect(validateUrl('').valid).toBe(false);
    });

    it('should reject non-URL string', () => {
      expect(validateUrl('not a url').valid).toBe(false);
    });

    it('should reject javascript: URL', () => {
      expect(validateUrl('javascript:alert(1)').valid).toBe(false);
    });

    it('should reject data: URL', () => {
      expect(validateUrl('data:text/html,<script>').valid).toBe(false);
    });

    it('should reject ftp: URL', () => {
      expect(validateUrl('ftp://example.com').valid).toBe(false);
    });
  });
});

describe('Number Validation', () => {
  describe('Basic Validation', () => {
    it('should accept valid integers', () => {
      expect(validateNumber(42).valid).toBe(true);
      expect(validateNumber('42').valid).toBe(true);
    });

    it('should accept valid floats', () => {
      expect(validateNumber(3.14).valid).toBe(true);
      expect(validateNumber('3.14').valid).toBe(true);
    });

    it('should accept negative numbers', () => {
      expect(validateNumber(-42).valid).toBe(true);
    });

    it('should accept zero', () => {
      expect(validateNumber(0).valid).toBe(true);
    });
  });

  describe('Invalid Numbers', () => {
    it('should reject NaN', () => {
      expect(validateNumber(NaN).valid).toBe(false);
    });

    it('should reject Infinity', () => {
      expect(validateNumber(Infinity).valid).toBe(false);
      expect(validateNumber(-Infinity).valid).toBe(false);
    });

    it('should reject non-numeric strings', () => {
      expect(validateNumber('abc').valid).toBe(false);
    });

    it('should reject null', () => {
      expect(validateNumber(null).valid).toBe(false);
    });
  });

  describe('Range Validation', () => {
    it('should validate minimum', () => {
      expect(validateNumber(5, { min: 0 }).valid).toBe(true);
      expect(validateNumber(-1, { min: 0 }).valid).toBe(false);
    });

    it('should validate maximum', () => {
      expect(validateNumber(5, { max: 10 }).valid).toBe(true);
      expect(validateNumber(15, { max: 10 }).valid).toBe(false);
    });

    it('should validate range', () => {
      expect(validateNumber(5, { min: 0, max: 10 }).valid).toBe(true);
      expect(validateNumber(-1, { min: 0, max: 10 }).valid).toBe(false);
      expect(validateNumber(15, { min: 0, max: 10 }).valid).toBe(false);
    });
  });

  describe('Integer Validation', () => {
    it('should accept integer when required', () => {
      expect(validateNumber(42, { integer: true }).valid).toBe(true);
    });

    it('should reject float when integer required', () => {
      expect(validateNumber(3.14, { integer: true }).valid).toBe(false);
    });
  });
});

describe('Date Validation', () => {
  describe('Valid Dates', () => {
    it('should accept ISO format', () => {
      expect(validateDate('2024-01-15').valid).toBe(true);
    });

    it('should accept ISO with time', () => {
      expect(validateDate('2024-01-15T10:30:00Z').valid).toBe(true);
    });

    it('should accept readable format', () => {
      expect(validateDate('January 15, 2024').valid).toBe(true);
    });
  });

  describe('Invalid Dates', () => {
    it('should reject empty date', () => {
      expect(validateDate('').valid).toBe(false);
    });

    it('should reject invalid format', () => {
      expect(validateDate('not-a-date').valid).toBe(false);
    });

    it('should reject out of range dates', () => {
      expect(validateDate('1800-01-01').valid).toBe(false);
      expect(validateDate('2200-01-01').valid).toBe(false);
    });
  });
});

describe('JSON Validation', () => {
  describe('Valid JSON', () => {
    it('should accept object', () => {
      const result = validateJson('{"name": "John"}');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual({ name: 'John' });
    });

    it('should accept array', () => {
      const result = validateJson('[1, 2, 3]');
      expect(result.valid).toBe(true);
      expect(result.data).toEqual([1, 2, 3]);
    });

    it('should accept primitive values', () => {
      expect(validateJson('"string"').valid).toBe(true);
      expect(validateJson('123').valid).toBe(true);
      expect(validateJson('true').valid).toBe(true);
      expect(validateJson('null').valid).toBe(true);
    });
  });

  describe('Invalid JSON', () => {
    it('should reject empty string', () => {
      expect(validateJson('').valid).toBe(false);
    });

    it('should reject malformed JSON', () => {
      expect(validateJson('{name: "John"}').valid).toBe(false);
      expect(validateJson("{'name': 'John'}").valid).toBe(false);
    });

    it('should reject incomplete JSON', () => {
      expect(validateJson('{"name":').valid).toBe(false);
    });
  });
});

describe('UUID Validation', () => {
  describe('Valid UUIDs', () => {
    it('should accept v4 UUID', () => {
      expect(validateUuid('550e8400-e29b-41d4-a716-446655440000').valid).toBe(true);
    });

    it('should accept uppercase UUID', () => {
      expect(validateUuid('550E8400-E29B-41D4-A716-446655440000').valid).toBe(true);
    });
  });

  describe('Invalid UUIDs', () => {
    it('should reject empty string', () => {
      expect(validateUuid('').valid).toBe(false);
    });

    it('should reject wrong format', () => {
      expect(validateUuid('not-a-uuid').valid).toBe(false);
      expect(validateUuid('550e8400e29b41d4a716446655440000').valid).toBe(false);
    });

    it('should reject too short', () => {
      expect(validateUuid('550e8400-e29b-41d4-a716').valid).toBe(false);
    });

    it('should reject wrong version', () => {
      expect(validateUuid('550e8400-e29b-71d4-a716-446655440000').valid).toBe(false);
    });
  });
});
