import { describe, it, expect } from 'vitest';

/**
 * Security Tests - Data Protection
 * 
 * Unit tests for data sanitization, masking, and protection
 */

// PII (Personally Identifiable Information) detection
function containsPii(text: string): { hasPii: boolean; types: string[] } {
  const patterns: Record<string, RegExp> = {
    email: /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/,
    phone: /(\+\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/,
    ssn: /\d{3}[-.\s]?\d{2}[-.\s]?\d{4}/,
    creditCard: /\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/,
    ipAddress: /\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}/,
  };
  
  const foundTypes: string[] = [];
  
  for (const [type, pattern] of Object.entries(patterns)) {
    if (pattern.test(text)) {
      foundTypes.push(type);
    }
  }
  
  return { hasPii: foundTypes.length > 0, types: foundTypes };
}

// Data masking
function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!domain) return '***@***';
  
  const maskedLocal = local.length > 2 
    ? local[0] + '*'.repeat(local.length - 2) + local[local.length - 1]
    : '*'.repeat(local.length);
  
  return `${maskedLocal}@${domain}`;
}

function maskPhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.length < 4) return '*'.repeat(digits.length);
  
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

function maskCreditCard(card: string): string {
  const digits = card.replace(/\D/g, '');
  if (digits.length < 4) return '*'.repeat(digits.length);
  
  return '*'.repeat(digits.length - 4) + digits.slice(-4);
}

function maskSsn(ssn: string): string {
  const digits = ssn.replace(/\D/g, '');
  if (digits.length !== 9) return '***-**-****';
  
  return `***-**-${digits.slice(-4)}`;
}

// Sensitive field detection in objects
function redactSensitiveFields<T extends Record<string, unknown>>(
  obj: T,
  sensitiveFields: string[]
): T {
  const result = { ...obj };
  
  for (const key of Object.keys(result)) {
    if (sensitiveFields.some(field => key.toLowerCase().includes(field.toLowerCase()))) {
      (result as Record<string, unknown>)[key] = '[REDACTED]';
    }
  }
  
  return result;
}

// Log sanitization
function sanitizeLogMessage(message: string): string {
  let sanitized = message;
  
  // Mask emails
  sanitized = sanitized.replace(
    /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/g,
    '[EMAIL]'
  );
  
  // Mask credit cards
  sanitized = sanitized.replace(
    /\d{4}[-.\s]?\d{4}[-.\s]?\d{4}[-.\s]?\d{4}/g,
    '[CREDIT_CARD]'
  );
  
  // Mask SSNs
  sanitized = sanitized.replace(
    /\d{3}[-.\s]?\d{2}[-.\s]?\d{4}/g,
    '[SSN]'
  );
  
  // Mask passwords in key=value format
  sanitized = sanitized.replace(
    /password\s*[=:]\s*['"]?[^'"\s]+['"]?/gi,
    'password=[HIDDEN]'
  );
  
  // Mask tokens
  sanitized = sanitized.replace(
    /token\s*[=:]\s*['"]?[A-Za-z0-9._-]+['"]?/gi,
    'token=[HIDDEN]'
  );
  
  return sanitized;
}

describe('PII Detection', () => {
  describe('Email Detection', () => {
    it('should detect email addresses', () => {
      const result = containsPii('Contact me at user@example.com');
      expect(result.hasPii).toBe(true);
      expect(result.types).toContain('email');
    });

    it('should detect multiple emails', () => {
      const result = containsPii('user1@test.com and user2@test.com');
      expect(result.types).toContain('email');
    });
  });

  describe('Phone Detection', () => {
    it('should detect phone numbers', () => {
      const result = containsPii('Call me at 123-456-7890');
      expect(result.hasPii).toBe(true);
      expect(result.types).toContain('phone');
    });

    it('should detect formatted phone', () => {
      const result = containsPii('Phone: (123) 456-7890');
      expect(result.types).toContain('phone');
    });

    it('should detect international phone', () => {
      const result = containsPii('Phone: +1 123-456-7890');
      expect(result.types).toContain('phone');
    });
  });

  describe('SSN Detection', () => {
    it('should detect SSN format', () => {
      const result = containsPii('SSN: 123-45-6789');
      expect(result.hasPii).toBe(true);
      expect(result.types).toContain('ssn');
    });

    it('should detect SSN without dashes', () => {
      const result = containsPii('SSN: 123456789');
      expect(result.types).toContain('ssn');
    });
  });

  describe('Credit Card Detection', () => {
    it('should detect credit card numbers', () => {
      const result = containsPii('Card: 4111-1111-1111-1111');
      expect(result.hasPii).toBe(true);
      expect(result.types).toContain('creditCard');
    });

    it('should detect card without separators', () => {
      const result = containsPii('Card: 4111111111111111');
      expect(result.types).toContain('creditCard');
    });
  });

  describe('IP Address Detection', () => {
    it('should detect IP addresses', () => {
      const result = containsPii('Server: 192.168.1.1');
      expect(result.hasPii).toBe(true);
      expect(result.types).toContain('ipAddress');
    });
  });

  describe('Clean Text', () => {
    it('should not flag clean text', () => {
      const result = containsPii('Hello, this is a normal message');
      expect(result.hasPii).toBe(false);
      expect(result.types).toHaveLength(0);
    });
  });
});

describe('Data Masking', () => {
  describe('Email Masking', () => {
    it('should mask email local part', () => {
      expect(maskEmail('john.doe@example.com')).toBe('j******e@example.com');
    });

    it('should handle short local part', () => {
      expect(maskEmail('ab@example.com')).toBe('**@example.com');
    });

    it('should handle invalid email', () => {
      expect(maskEmail('invalid')).toBe('***@***');
    });
  });

  describe('Phone Masking', () => {
    it('should show only last 4 digits', () => {
      expect(maskPhone('123-456-7890')).toBe('******7890');
    });

    it('should handle different formats', () => {
      expect(maskPhone('(123) 456-7890')).toBe('******7890');
      expect(maskPhone('+1 123 456 7890')).toBe('*******7890');
    });

    it('should handle short numbers', () => {
      expect(maskPhone('123')).toBe('***');
    });
  });

  describe('Credit Card Masking', () => {
    it('should show only last 4 digits', () => {
      expect(maskCreditCard('4111-1111-1111-1111')).toBe('************1111');
    });

    it('should handle different formats', () => {
      expect(maskCreditCard('4111111111111111')).toBe('************1111');
    });
  });

  describe('SSN Masking', () => {
    it('should mask SSN', () => {
      expect(maskSsn('123-45-6789')).toBe('***-**-6789');
    });

    it('should handle unformatted SSN', () => {
      expect(maskSsn('123456789')).toBe('***-**-6789');
    });

    it('should handle invalid SSN', () => {
      expect(maskSsn('12345')).toBe('***-**-****');
    });
  });
});

describe('Sensitive Field Redaction', () => {
  it('should redact password fields', () => {
    const obj = { username: 'john', password: 'secret123' };
    const redacted = redactSensitiveFields(obj, ['password']);
    
    expect(redacted.username).toBe('john');
    expect(redacted.password).toBe('[REDACTED]');
  });

  it('should redact token fields', () => {
    const obj = { userId: 'u1', accessToken: 'abc123', refreshToken: 'xyz789' };
    const redacted = redactSensitiveFields(obj, ['token']);
    
    expect(redacted.userId).toBe('u1');
    expect(redacted.accessToken).toBe('[REDACTED]');
    expect(redacted.refreshToken).toBe('[REDACTED]');
  });

  it('should redact multiple sensitive fields', () => {
    const obj = { 
      name: 'John',
      password: 'secret',
      apiKey: 'key123',
      email: 'john@test.com',
    };
    const redacted = redactSensitiveFields(obj, ['password', 'key', 'secret']);
    
    expect(redacted.name).toBe('John');
    expect(redacted.password).toBe('[REDACTED]');
    expect(redacted.apiKey).toBe('[REDACTED]');
    expect(redacted.email).toBe('john@test.com');
  });

  it('should be case insensitive', () => {
    const obj = { PASSWORD: 'secret', Password: 'secret2' };
    const redacted = redactSensitiveFields(obj, ['password']);
    
    expect(redacted.PASSWORD).toBe('[REDACTED]');
    expect(redacted.Password).toBe('[REDACTED]');
  });

  it('should not modify original object', () => {
    const obj = { password: 'secret' };
    redactSensitiveFields(obj, ['password']);
    
    expect(obj.password).toBe('secret');
  });
});

describe('Log Sanitization', () => {
  it('should mask emails in logs', () => {
    const log = 'User john@example.com logged in';
    expect(sanitizeLogMessage(log)).toBe('User [EMAIL] logged in');
  });

  it('should mask credit cards in logs', () => {
    const log = 'Processing payment for 4111-1111-1111-1111';
    expect(sanitizeLogMessage(log)).toBe('Processing payment for [CREDIT_CARD]');
  });

  it('should mask SSNs in logs', () => {
    const log = 'SSN verification: 123-45-6789';
    expect(sanitizeLogMessage(log)).toBe('SSN verification: [SSN]');
  });

  it('should mask passwords in logs', () => {
    const log = 'Login attempt with password=secret123';
    expect(sanitizeLogMessage(log)).toBe('Login attempt with password=[HIDDEN]');
  });

  it('should mask tokens in logs', () => {
    const log = 'Auth token: abc123xyz';
    expect(sanitizeLogMessage(log)).toBe('Auth token=[HIDDEN]');
  });

  it('should mask multiple sensitive items', () => {
    const log = 'User user@test.com with card 4111-1111-1111-1111';
    const sanitized = sanitizeLogMessage(log);
    
    expect(sanitized).not.toContain('user@test.com');
    expect(sanitized).not.toContain('4111');
  });

  it('should preserve non-sensitive content', () => {
    const log = 'System started successfully';
    expect(sanitizeLogMessage(log)).toBe('System started successfully');
  });
});

describe('Data Classification', () => {
  type Classification = 'public' | 'internal' | 'confidential' | 'restricted';

  function classifyData(data: Record<string, unknown>): Classification {
    const restrictedFields = ['ssn', 'password', 'creditcard', 'bankaccount'];
    const confidentialFields = ['salary', 'medicalrecord', 'dob', 'address'];
    const internalFields = ['employeeid', 'department', 'manager'];
    
    const keys = Object.keys(data).map(k => k.toLowerCase());
    
    if (keys.some(k => restrictedFields.some(f => k.includes(f)))) {
      return 'restricted';
    }
    
    if (keys.some(k => confidentialFields.some(f => k.includes(f)))) {
      return 'confidential';
    }
    
    if (keys.some(k => internalFields.some(f => k.includes(f)))) {
      return 'internal';
    }
    
    return 'public';
  }

  it('should classify restricted data', () => {
    expect(classifyData({ ssn: '123-45-6789' })).toBe('restricted');
    expect(classifyData({ password: 'secret' })).toBe('restricted');
    expect(classifyData({ creditCard: '4111111111111111' })).toBe('restricted');
  });

  it('should classify confidential data', () => {
    expect(classifyData({ salary: 50000 })).toBe('confidential');
    expect(classifyData({ dob: '1990-01-01' })).toBe('confidential');
    expect(classifyData({ address: '123 Main St' })).toBe('confidential');
  });

  it('should classify internal data', () => {
    expect(classifyData({ employeeId: 'E123' })).toBe('internal');
    expect(classifyData({ department: 'IT' })).toBe('internal');
  });

  it('should classify public data', () => {
    expect(classifyData({ name: 'John', title: 'Engineer' })).toBe('public');
  });

  it('should use highest classification when mixed', () => {
    expect(classifyData({ name: 'John', ssn: '123-45-6789' })).toBe('restricted');
    expect(classifyData({ department: 'IT', salary: 50000 })).toBe('confidential');
  });
});

describe('Data Retention', () => {
  interface DataRecord {
    id: string;
    createdAt: Date;
    type: string;
    retentionDays: number;
  }

  function isExpired(record: DataRecord, now: Date = new Date()): boolean {
    const expirationDate = new Date(record.createdAt);
    expirationDate.setDate(expirationDate.getDate() + record.retentionDays);
    return now > expirationDate;
  }

  function shouldPurge(record: DataRecord, now: Date = new Date()): boolean {
    // Add 30-day grace period after expiration
    const purgeDate = new Date(record.createdAt);
    purgeDate.setDate(purgeDate.getDate() + record.retentionDays + 30);
    return now > purgeDate;
  }

  it('should identify non-expired records', () => {
    const record: DataRecord = {
      id: 'r1',
      createdAt: new Date(),
      type: 'log',
      retentionDays: 90,
    };
    expect(isExpired(record)).toBe(false);
  });

  it('should identify expired records', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    
    const record: DataRecord = {
      id: 'r1',
      createdAt: oldDate,
      type: 'log',
      retentionDays: 90,
    };
    expect(isExpired(record)).toBe(true);
  });

  it('should respect grace period for purging', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 100);
    
    const record: DataRecord = {
      id: 'r1',
      createdAt: oldDate,
      type: 'log',
      retentionDays: 90,
    };
    
    expect(isExpired(record)).toBe(true);
    expect(shouldPurge(record)).toBe(false);
  });

  it('should allow purging after grace period', () => {
    const oldDate = new Date();
    oldDate.setDate(oldDate.getDate() - 150);
    
    const record: DataRecord = {
      id: 'r1',
      createdAt: oldDate,
      type: 'log',
      retentionDays: 90,
    };
    
    expect(shouldPurge(record)).toBe(true);
  });
});
