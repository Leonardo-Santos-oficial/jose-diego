import { describe, it, expect } from 'vitest';

/**
 * Security Tests - Password Validation
 * 
 * Unit tests for password strength, validation, and security requirements
 */

interface PasswordValidationResult {
  valid: boolean;
  score: number; // 0-4 (0=very weak, 4=very strong)
  errors: string[];
  suggestions: string[];
}

interface PasswordPolicy {
  minLength: number;
  maxLength: number;
  requireUppercase: boolean;
  requireLowercase: boolean;
  requireNumbers: boolean;
  requireSpecialChars: boolean;
  forbiddenPatterns: RegExp[];
}

const DEFAULT_POLICY: PasswordPolicy = {
  minLength: 8,
  maxLength: 128,
  requireUppercase: true,
  requireLowercase: true,
  requireNumbers: true,
  requireSpecialChars: false, // Recommended but not required
  forbiddenPatterns: [
    /^password$/i,
    /^123456/,
    /^qwerty/i,
    /^admin$/i,
    /(.)\1{3,}/, // 4+ repeated characters
  ],
};

function validatePassword(password: string, policy: PasswordPolicy = DEFAULT_POLICY): PasswordValidationResult {
  const errors: string[] = [];
  const suggestions: string[] = [];
  let score = 0;

  // Check length
  if (password.length < policy.minLength) {
    errors.push(`Senha deve ter no mínimo ${policy.minLength} caracteres`);
  } else {
    score += 1;
  }

  if (password.length > policy.maxLength) {
    errors.push(`Senha deve ter no máximo ${policy.maxLength} caracteres`);
  }

  // Check uppercase
  if (policy.requireUppercase && !/[A-Z]/.test(password)) {
    errors.push('Senha deve conter letra maiúscula');
  } else if (/[A-Z]/.test(password)) {
    score += 0.5;
  }

  // Check lowercase
  if (policy.requireLowercase && !/[a-z]/.test(password)) {
    errors.push('Senha deve conter letra minúscula');
  } else if (/[a-z]/.test(password)) {
    score += 0.5;
  }

  // Check numbers
  if (policy.requireNumbers && !/\d/.test(password)) {
    errors.push('Senha deve conter número');
  } else if (/\d/.test(password)) {
    score += 0.5;
  }

  // Check special characters
  if (policy.requireSpecialChars && !/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push('Senha deve conter caractere especial');
  } else if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    score += 0.5;
    suggestions.push('Ótimo! Caracteres especiais aumentam a segurança');
  }

  // Check forbidden patterns
  for (const pattern of policy.forbiddenPatterns) {
    if (pattern.test(password)) {
      errors.push('Senha contém padrão comum ou fraco');
      score = Math.max(0, score - 1);
      break;
    }
  }

  // Bonus for length
  if (password.length >= 12) score += 0.5;
  if (password.length >= 16) score += 0.5;

  // Add suggestions
  if (!errors.length && score < 3) {
    if (!/[!@#$%^&*]/.test(password)) {
      suggestions.push('Adicione caracteres especiais para maior segurança');
    }
    if (password.length < 12) {
      suggestions.push('Senhas mais longas são mais seguras');
    }
  }

  return {
    valid: errors.length === 0,
    score: Math.min(4, Math.floor(score)),
    errors,
    suggestions,
  };
}

function calculateEntropy(password: string): number {
  const charsetSize = 
    (/[a-z]/.test(password) ? 26 : 0) +
    (/[A-Z]/.test(password) ? 26 : 0) +
    (/\d/.test(password) ? 10 : 0) +
    (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password) ? 32 : 0);
  
  return password.length * Math.log2(charsetSize || 1);
}

describe('Password Validation', () => {
  describe('Length Requirements', () => {
    it('should reject password shorter than minimum', () => {
      const result = validatePassword('Short1');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Senha deve ter no mínimo 8 caracteres');
    });

    it('should accept password meeting minimum length', () => {
      const result = validatePassword('ValidPwd1');
      expect(result.errors).not.toContain('Senha deve ter no mínimo 8 caracteres');
    });

    it('should reject password exceeding maximum length', () => {
      const longPassword = 'A'.repeat(129) + '1a';
      const result = validatePassword(longPassword);
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Senha deve ter no máximo 128 caracteres');
    });
  });

  describe('Character Requirements', () => {
    it('should require uppercase letter', () => {
      const result = validatePassword('lowercase123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Senha deve conter letra maiúscula');
    });

    it('should require lowercase letter', () => {
      const result = validatePassword('UPPERCASE123');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Senha deve conter letra minúscula');
    });

    it('should require number', () => {
      const result = validatePassword('NoNumbersHere');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Senha deve conter número');
    });

    it('should accept password with all requirements', () => {
      const result = validatePassword('ValidPassword123');
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Forbidden Patterns', () => {
    it('should reject "password" variations', () => {
      expect(validatePassword('password').valid).toBe(false);
      expect(validatePassword('Password').valid).toBe(false);
      expect(validatePassword('PASSWORD').valid).toBe(false);
    });

    it('should reject "123456" pattern', () => {
      const result = validatePassword('123456789');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Senha contém padrão comum ou fraco');
    });

    it('should reject "qwerty" variations', () => {
      expect(validatePassword('qwerty123').valid).toBe(false);
      expect(validatePassword('QWERTY123').valid).toBe(false);
    });

    it('should reject repeated characters', () => {
      const result = validatePassword('aaaa1234BBBB');
      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Senha contém padrão comum ou fraco');
    });

    it('should reject "admin"', () => {
      expect(validatePassword('admin123').valid).toBe(false);
    });
  });

  describe('Password Strength Score', () => {
    it('should give low score to weak password', () => {
      const result = validatePassword('weak');
      expect(result.score).toBeLessThanOrEqual(1);
    });

    it('should give medium score to decent password', () => {
      const result = validatePassword('Decent123');
      expect(result.score).toBeGreaterThanOrEqual(2);
    });

    it('should give high score to strong password', () => {
      const result = validatePassword('StrongP@ssw0rd!123');
      expect(result.score).toBeGreaterThanOrEqual(3);
    });

    it('should cap score at 4', () => {
      const result = validatePassword('VeryStr0ng&SecureP@ssword!2025');
      expect(result.score).toBeLessThanOrEqual(4);
    });
  });

  describe('Suggestions', () => {
    it('should suggest special characters for valid but weak password', () => {
      const result = validatePassword('ValidPwd1');
      expect(result.valid).toBe(true);
      expect(result.suggestions.some(s => s.includes('especiais'))).toBe(true);
    });

    it('should suggest longer password', () => {
      const result = validatePassword('Short1Aa');
      expect(result.suggestions.some(s => s.includes('longas'))).toBe(true);
    });
  });
});

describe('Password Entropy', () => {
  it('should calculate higher entropy for diverse character sets', () => {
    const simple = calculateEntropy('aaaaaaaa');
    const mixed = calculateEntropy('Aa1!Bb2@');
    
    expect(mixed).toBeGreaterThan(simple);
  });

  it('should calculate higher entropy for longer passwords', () => {
    const short = calculateEntropy('Abc123!');
    const long = calculateEntropy('Abc123!Abc123!');
    
    expect(long).toBeGreaterThan(short);
  });

  it('should return positive entropy for valid password', () => {
    const entropy = calculateEntropy('SecurePassword123!');
    expect(entropy).toBeGreaterThan(0);
  });
});

describe('Password Comparison Security', () => {
  // Timing-safe comparison (simplified - in production use crypto.timingSafeEqual)
  function secureCompare(a: string, b: string): boolean {
    if (a.length !== b.length) return false;
    
    let result = 0;
    for (let i = 0; i < a.length; i++) {
      result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }
    return result === 0;
  }

  it('should return true for equal strings', () => {
    expect(secureCompare('password123', 'password123')).toBe(true);
  });

  it('should return false for different strings', () => {
    expect(secureCompare('password123', 'password124')).toBe(false);
  });

  it('should return false for different length strings', () => {
    expect(secureCompare('short', 'longerstring')).toBe(false);
  });

  it('should return true for empty strings', () => {
    expect(secureCompare('', '')).toBe(true);
  });
});

describe('Common Password Detection', () => {
  const COMMON_PASSWORDS = [
    '123456',
    'password',
    '12345678',
    'qwerty',
    '123456789',
    '12345',
    '1234',
    '111111',
    '1234567',
    'dragon',
    '123123',
    'baseball',
    'iloveyou',
    'trustno1',
    'sunshine',
    'master',
    'welcome',
    'shadow',
    'ashley',
    'football',
    'jesus',
    'michael',
    'ninja',
    'mustang',
  ];

  function isCommonPassword(password: string): boolean {
    const normalized = password.toLowerCase();
    return COMMON_PASSWORDS.includes(normalized);
  }

  it('should detect common passwords', () => {
    expect(isCommonPassword('password')).toBe(true);
    expect(isCommonPassword('123456')).toBe(true);
    expect(isCommonPassword('qwerty')).toBe(true);
    expect(isCommonPassword('iloveyou')).toBe(true);
  });

  it('should be case insensitive', () => {
    expect(isCommonPassword('PASSWORD')).toBe(true);
    expect(isCommonPassword('PassWord')).toBe(true);
    expect(isCommonPassword('QWERTY')).toBe(true);
  });

  it('should not flag unique passwords', () => {
    expect(isCommonPassword('UniqueP@ssw0rd!')).toBe(false);
    expect(isCommonPassword('MySecretKey2025')).toBe(false);
  });
});

describe('Password Hashing Validation', () => {
  // Validate that password looks like a hash (not plaintext)
  function looksLikeHash(value: string): boolean {
    // Common hash patterns
    const hashPatterns = [
      /^\$2[aby]?\$\d{1,2}\$[./A-Za-z0-9]{53}$/, // bcrypt
      /^[a-f0-9]{64}$/, // SHA-256
      /^[a-f0-9]{128}$/, // SHA-512
      /^\$argon2(i|d|id)\$/, // Argon2
    ];
    
    return hashPatterns.some(pattern => pattern.test(value));
  }

  it('should detect bcrypt hash', () => {
    const bcryptHash = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy';
    expect(looksLikeHash(bcryptHash)).toBe(true);
  });

  it('should detect SHA-256 hash', () => {
    const sha256 = '5e884898da28047d9171a6e52aa40bc7a21f153d90e5e5e3e77d0f3e4a9f9a99';
    expect(looksLikeHash(sha256)).toBe(true);
  });

  it('should not detect plaintext as hash', () => {
    expect(looksLikeHash('password123')).toBe(false);
    expect(looksLikeHash('MySecurePassword!')).toBe(false);
  });

  it('should not detect short strings as hash', () => {
    expect(looksLikeHash('abc123')).toBe(false);
  });
});
