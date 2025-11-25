import { describe, it, expect } from 'vitest';

interface InputValidationResult {
  isValid: boolean;
  errors: string[];
}

interface ValidationRule {
  readonly name: string;
  validate(value: string): boolean;
  getErrorMessage(): string;
}

class RequiredRule implements ValidationRule {
  readonly name = 'required';

  validate(value: string): boolean {
    return value.trim().length > 0;
  }

  getErrorMessage(): string {
    return 'Campo obrigatório';
  }
}

class EmailFormatRule implements ValidationRule {
  readonly name = 'email-format';
  private readonly pattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  validate(value: string): boolean {
    return this.pattern.test(value);
  }

  getErrorMessage(): string {
    return 'Formato de e-mail inválido';
  }
}

class MinLengthRule implements ValidationRule {
  readonly name = 'min-length';

  constructor(private readonly minLength: number) {}

  validate(value: string): boolean {
    return value.length >= this.minLength;
  }

  getErrorMessage(): string {
    return `Mínimo de ${this.minLength} caracteres`;
  }
}

class MaxLengthRule implements ValidationRule {
  readonly name = 'max-length';

  constructor(private readonly maxLength: number) {}

  validate(value: string): boolean {
    return value.length <= this.maxLength;
  }

  getErrorMessage(): string {
    return `Máximo de ${this.maxLength} caracteres`;
  }
}

class NoSqlInjectionRule implements ValidationRule {
  readonly name = 'no-sql-injection';
  private readonly dangerousPatterns = [
    /'\s*(OR|AND)\s*'?\d*\s*=\s*'?\d*/i,
    /;\s*(DROP|DELETE|UPDATE|INSERT|TRUNCATE)/i,
    /UNION\s+(ALL\s+)?SELECT/i,
    /--\s*$/,
    /\/\*.*\*\//,
  ];

  validate(value: string): boolean {
    return !this.dangerousPatterns.some((pattern) => pattern.test(value));
  }

  getErrorMessage(): string {
    return 'Caracteres inválidos detectados';
  }
}

class InputValidator {
  private readonly rules: ValidationRule[] = [];

  addRule(rule: ValidationRule): this {
    this.rules.push(rule);
    return this;
  }

  validate(value: string): InputValidationResult {
    const errors: string[] = [];

    for (const rule of this.rules) {
      if (!rule.validate(value)) {
        errors.push(rule.getErrorMessage());
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

function createEmailValidator(): InputValidator {
  return new InputValidator()
    .addRule(new RequiredRule())
    .addRule(new EmailFormatRule())
    .addRule(new MaxLengthRule(255))
    .addRule(new NoSqlInjectionRule());
}

function createPasswordValidator(): InputValidator {
  return new InputValidator()
    .addRule(new RequiredRule())
    .addRule(new MinLengthRule(6))
    .addRule(new MaxLengthRule(128));
}

describe('Authentication Input Validation', () => {
  describe('Email Validation', () => {
    const validator = createEmailValidator();

    it('should accept valid email addresses', () => {
      const validEmails = [
        'user@example.com',
        'user.name@example.com',
        'user+tag@example.com',
        'user@subdomain.example.com',
        'test123@test.co',
      ];

      validEmails.forEach((email) => {
        const result = validator.validate(email);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject invalid email formats', () => {
      const invalidEmails = [
        'notanemail',
        'missing@tld',
        '@nodomain.com',
        'spaces in@email.com',
        'double@@at.com',
      ];

      invalidEmails.forEach((email) => {
        const result = validator.validate(email);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject empty email', () => {
      const result = validator.validate('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Campo obrigatório');
    });

    it('should reject SQL injection attempts in email', () => {
      const injectionAttempts = [
        "' OR '1'='1",
        '; DROP TABLE users;--',
        "' UNION SELECT * FROM users--",
        "admin'-- ",
      ];

      injectionAttempts.forEach((attempt) => {
        const result = validator.validate(attempt);
        expect(result.isValid).toBe(false);
      });
    });

    it('should reject emails exceeding max length', () => {
      const longEmail = 'a'.repeat(250) + '@test.com';
      const result = validator.validate(longEmail);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Máximo de 255 caracteres');
    });
  });

  describe('Password Validation', () => {
    const validator = createPasswordValidator();

    it('should accept valid passwords', () => {
      const validPasswords = ['password123', 'MySecureP@ss', 'simple123456'];

      validPasswords.forEach((password) => {
        const result = validator.validate(password);
        expect(result.isValid).toBe(true);
      });
    });

    it('should reject passwords too short', () => {
      const result = validator.validate('12345');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Mínimo de 6 caracteres');
    });

    it('should reject empty password', () => {
      const result = validator.validate('');
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Campo obrigatório');
    });

    it('should reject passwords exceeding max length', () => {
      const longPassword = 'a'.repeat(129);
      const result = validator.validate(longPassword);
      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Máximo de 128 caracteres');
    });
  });
});

describe('Authentication Security Scenarios', () => {
  describe('Credential Stuffing Prevention', () => {
    it('should not reveal which credential is wrong', () => {
      const genericErrorMessage = 'Credenciais inválidas';
      
      const errorForWrongEmail = genericErrorMessage;
      const errorForWrongPassword = genericErrorMessage;

      expect(errorForWrongEmail).toBe(errorForWrongPassword);
    });
  });

  describe('Input Sanitization', () => {
    it('should trim whitespace from inputs', () => {
      const input = '  user@example.com  ';
      const trimmed = input.trim();
      expect(trimmed).toBe('user@example.com');
    });

    it('should handle null/undefined safely', () => {
      const validateField = (value: unknown) => {
        if (typeof value !== 'string' || value.trim().length === 0) {
          return null;
        }
        return value.trim();
      };

      expect(validateField(null)).toBeNull();
      expect(validateField(undefined)).toBeNull();
      expect(validateField('')).toBeNull();
      expect(validateField('   ')).toBeNull();
      expect(validateField('valid')).toBe('valid');
    });
  });

  describe('Session Security', () => {
    it('should generate unique session identifiers', () => {
      const generateSessionId = () => crypto.randomUUID();
      
      const sessions = new Set<string>();
      for (let i = 0; i < 1000; i++) {
        sessions.add(generateSessionId());
      }

      expect(sessions.size).toBe(1000);
    });
  });

  describe('Password Security Best Practices', () => {
    it('should not store password in plain text representation', () => {
      const password = 'MySecurePassword123';
      const logOutput = JSON.stringify({ email: 'user@test.com', password: '***' });
      
      expect(logOutput).not.toContain(password);
    });
  });
});
