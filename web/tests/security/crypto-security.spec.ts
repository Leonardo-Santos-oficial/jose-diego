import { describe, it, expect } from 'vitest';

/**
 * Security Tests - Cryptographic Security
 * 
 * Unit tests for cryptographic operations and security
 */

// Hash validation
function isValidHash(hash: string, algorithm: 'sha256' | 'sha512' | 'md5'): boolean {
  const lengths: Record<string, number> = {
    md5: 32,
    sha256: 64,
    sha512: 128,
  };
  
  const expectedLength = lengths[algorithm];
  if (!expectedLength) return false;
  
  return hash.length === expectedLength && /^[a-f0-9]+$/i.test(hash);
}

// Key derivation validation
interface KeyDerivationParams {
  iterations: number;
  keyLength: number;
  saltLength: number;
}

function validateKeyDerivationParams(params: KeyDerivationParams): string[] {
  const issues: string[] = [];
  
  if (params.iterations < 100000) {
    issues.push('Iterations should be at least 100,000 for PBKDF2');
  }
  
  if (params.keyLength < 32) {
    issues.push('Key length should be at least 256 bits (32 bytes)');
  }
  
  if (params.saltLength < 16) {
    issues.push('Salt should be at least 128 bits (16 bytes)');
  }
  
  return issues;
}

// Random bytes validation
function validateRandomBytes(bytes: Uint8Array): { valid: boolean; reason?: string } {
  if (bytes.length < 16) {
    return { valid: false, reason: 'Insufficient entropy: need at least 16 bytes' };
  }
  
  // Check for obvious patterns (all zeros, all ones)
  const allZeros = bytes.every(b => b === 0);
  const allOnes = bytes.every(b => b === 255);
  
  if (allZeros || allOnes) {
    return { valid: false, reason: 'Suspicious pattern detected' };
  }
  
  // Check for repeating patterns
  if (bytes.length >= 8) {
    let repeating = true;
    const pattern = bytes.slice(0, 4);
    for (let i = 4; i < bytes.length; i += 4) {
      for (let j = 0; j < 4 && i + j < bytes.length; j++) {
        if (bytes[i + j] !== pattern[j]) {
          repeating = false;
          break;
        }
      }
      if (!repeating) break;
    }
    if (repeating) {
      return { valid: false, reason: 'Repeating pattern detected' };
    }
  }
  
  return { valid: true };
}

// Encryption mode validation
type EncryptionMode = 'ECB' | 'CBC' | 'CTR' | 'GCM';

function validateEncryptionMode(mode: EncryptionMode): { secure: boolean; reason?: string } {
  switch (mode) {
    case 'ECB':
      return { secure: false, reason: 'ECB mode is not semantically secure' };
    case 'CBC':
      return { secure: true, reason: 'CBC is secure with proper IV handling' };
    case 'CTR':
      return { secure: true, reason: 'CTR is secure with unique nonces' };
    case 'GCM':
      return { secure: true, reason: 'GCM provides authenticated encryption' };
    default:
      return { secure: false, reason: 'Unknown encryption mode' };
  }
}

// IV/Nonce validation
function validateIV(iv: Uint8Array, algorithm: 'AES-CBC' | 'AES-GCM'): string[] {
  const issues: string[] = [];
  
  const expectedLength = algorithm === 'AES-CBC' ? 16 : 12;
  
  if (iv.length !== expectedLength) {
    issues.push(`IV length should be ${expectedLength} bytes for ${algorithm}`);
  }
  
  // Check for all zeros
  if (iv.every(b => b === 0)) {
    issues.push('IV should not be all zeros');
  }
  
  return issues;
}

// Key length validation
function validateKeyLength(keyBits: number, algorithm: 'AES' | 'RSA'): boolean {
  if (algorithm === 'AES') {
    return [128, 192, 256].includes(keyBits);
  }
  
  if (algorithm === 'RSA') {
    return keyBits >= 2048;
  }
  
  return false;
}

describe('Hash Validation', () => {
  describe('SHA-256', () => {
    it('should accept valid SHA-256 hash', () => {
      const hash = 'a'.repeat(64);
      expect(isValidHash(hash, 'sha256')).toBe(true);
    });

    it('should reject wrong length', () => {
      expect(isValidHash('a'.repeat(32), 'sha256')).toBe(false);
      expect(isValidHash('a'.repeat(128), 'sha256')).toBe(false);
    });

    it('should reject non-hex characters', () => {
      expect(isValidHash('g'.repeat(64), 'sha256')).toBe(false);
    });
  });

  describe('SHA-512', () => {
    it('should accept valid SHA-512 hash', () => {
      const hash = 'a'.repeat(128);
      expect(isValidHash(hash, 'sha512')).toBe(true);
    });

    it('should reject wrong length', () => {
      expect(isValidHash('a'.repeat(64), 'sha512')).toBe(false);
    });
  });

  describe('MD5', () => {
    it('should accept valid MD5 hash', () => {
      const hash = 'a'.repeat(32);
      expect(isValidHash(hash, 'md5')).toBe(true);
    });

    it('should reject wrong length', () => {
      expect(isValidHash('a'.repeat(16), 'md5')).toBe(false);
    });
  });
});

describe('Key Derivation Parameters', () => {
  it('should accept secure parameters', () => {
    const params: KeyDerivationParams = {
      iterations: 100000,
      keyLength: 32,
      saltLength: 16,
    };
    expect(validateKeyDerivationParams(params)).toHaveLength(0);
  });

  it('should flag low iterations', () => {
    const params: KeyDerivationParams = {
      iterations: 1000,
      keyLength: 32,
      saltLength: 16,
    };
    const issues = validateKeyDerivationParams(params);
    expect(issues).toContain('Iterations should be at least 100,000 for PBKDF2');
  });

  it('should flag short key length', () => {
    const params: KeyDerivationParams = {
      iterations: 100000,
      keyLength: 16,
      saltLength: 16,
    };
    const issues = validateKeyDerivationParams(params);
    expect(issues).toContain('Key length should be at least 256 bits (32 bytes)');
  });

  it('should flag short salt', () => {
    const params: KeyDerivationParams = {
      iterations: 100000,
      keyLength: 32,
      saltLength: 8,
    };
    const issues = validateKeyDerivationParams(params);
    expect(issues).toContain('Salt should be at least 128 bits (16 bytes)');
  });

  it('should flag multiple issues', () => {
    const params: KeyDerivationParams = {
      iterations: 1000,
      keyLength: 16,
      saltLength: 8,
    };
    const issues = validateKeyDerivationParams(params);
    expect(issues.length).toBe(3);
  });
});

describe('Random Bytes Validation', () => {
  it('should accept good random bytes', () => {
    const bytes = new Uint8Array([
      0x12, 0x34, 0x56, 0x78, 0x9a, 0xbc, 0xde, 0xf0,
      0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88,
    ]);
    expect(validateRandomBytes(bytes).valid).toBe(true);
  });

  it('should reject insufficient length', () => {
    const bytes = new Uint8Array([0x12, 0x34, 0x56, 0x78]);
    const result = validateRandomBytes(bytes);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Insufficient entropy');
  });

  it('should reject all zeros', () => {
    const bytes = new Uint8Array(16).fill(0);
    const result = validateRandomBytes(bytes);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Suspicious pattern');
  });

  it('should reject all ones', () => {
    const bytes = new Uint8Array(16).fill(255);
    const result = validateRandomBytes(bytes);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Suspicious pattern');
  });

  it('should reject repeating patterns', () => {
    const bytes = new Uint8Array([
      0x12, 0x34, 0x56, 0x78,
      0x12, 0x34, 0x56, 0x78,
      0x12, 0x34, 0x56, 0x78,
      0x12, 0x34, 0x56, 0x78,
    ]);
    const result = validateRandomBytes(bytes);
    expect(result.valid).toBe(false);
    expect(result.reason).toContain('Repeating pattern');
  });
});

describe('Encryption Mode Validation', () => {
  it('should reject ECB mode', () => {
    const result = validateEncryptionMode('ECB');
    expect(result.secure).toBe(false);
    expect(result.reason).toContain('not semantically secure');
  });

  it('should accept CBC mode', () => {
    const result = validateEncryptionMode('CBC');
    expect(result.secure).toBe(true);
  });

  it('should accept CTR mode', () => {
    const result = validateEncryptionMode('CTR');
    expect(result.secure).toBe(true);
  });

  it('should recommend GCM mode', () => {
    const result = validateEncryptionMode('GCM');
    expect(result.secure).toBe(true);
    expect(result.reason).toContain('authenticated encryption');
  });
});

describe('IV/Nonce Validation', () => {
  describe('AES-CBC', () => {
    it('should accept valid 16-byte IV', () => {
      const iv = new Uint8Array(16).fill(1);
      expect(validateIV(iv, 'AES-CBC')).toHaveLength(0);
    });

    it('should reject wrong length IV', () => {
      const iv = new Uint8Array(12).fill(1);
      const issues = validateIV(iv, 'AES-CBC');
      expect(issues).toContain('IV length should be 16 bytes for AES-CBC');
    });

    it('should reject all-zero IV', () => {
      const iv = new Uint8Array(16).fill(0);
      const issues = validateIV(iv, 'AES-CBC');
      expect(issues).toContain('IV should not be all zeros');
    });
  });

  describe('AES-GCM', () => {
    it('should accept valid 12-byte nonce', () => {
      const iv = new Uint8Array(12).fill(1);
      expect(validateIV(iv, 'AES-GCM')).toHaveLength(0);
    });

    it('should reject wrong length nonce', () => {
      const iv = new Uint8Array(16).fill(1);
      const issues = validateIV(iv, 'AES-GCM');
      expect(issues).toContain('IV length should be 12 bytes for AES-GCM');
    });
  });
});

describe('Key Length Validation', () => {
  describe('AES', () => {
    it('should accept AES-128', () => {
      expect(validateKeyLength(128, 'AES')).toBe(true);
    });

    it('should accept AES-192', () => {
      expect(validateKeyLength(192, 'AES')).toBe(true);
    });

    it('should accept AES-256', () => {
      expect(validateKeyLength(256, 'AES')).toBe(true);
    });

    it('should reject invalid AES key lengths', () => {
      expect(validateKeyLength(64, 'AES')).toBe(false);
      expect(validateKeyLength(512, 'AES')).toBe(false);
    });
  });

  describe('RSA', () => {
    it('should accept RSA-2048', () => {
      expect(validateKeyLength(2048, 'RSA')).toBe(true);
    });

    it('should accept RSA-4096', () => {
      expect(validateKeyLength(4096, 'RSA')).toBe(true);
    });

    it('should reject RSA-1024', () => {
      expect(validateKeyLength(1024, 'RSA')).toBe(false);
    });

    it('should reject RSA-512', () => {
      expect(validateKeyLength(512, 'RSA')).toBe(false);
    });
  });
});

describe('Password Storage Security', () => {
  interface PasswordHashConfig {
    algorithm: string;
    iterations?: number;
    memoryCost?: number;
    timeCost?: number;
    parallelism?: number;
  }

  function validatePasswordHashConfig(config: PasswordHashConfig): string[] {
    const issues: string[] = [];
    
    const insecureAlgorithms = ['md5', 'sha1', 'sha256', 'sha512'];
    if (insecureAlgorithms.includes(config.algorithm.toLowerCase())) {
      issues.push(`${config.algorithm} is not suitable for password hashing`);
    }
    
    const secureAlgorithms = ['bcrypt', 'scrypt', 'argon2', 'argon2i', 'argon2d', 'argon2id'];
    if (!secureAlgorithms.includes(config.algorithm.toLowerCase())) {
      issues.push('Use bcrypt, scrypt, or argon2 for password hashing');
    }
    
    if (config.algorithm.toLowerCase() === 'bcrypt') {
      const cost = config.iterations || 10;
      if (cost < 10) {
        issues.push('bcrypt cost factor should be at least 10');
      }
    }
    
    return issues;
  }

  it('should accept bcrypt with good cost', () => {
    const config: PasswordHashConfig = {
      algorithm: 'bcrypt',
      iterations: 12,
    };
    expect(validatePasswordHashConfig(config)).toHaveLength(0);
  });

  it('should accept argon2id', () => {
    const config: PasswordHashConfig = {
      algorithm: 'argon2id',
      memoryCost: 65536,
      timeCost: 3,
      parallelism: 4,
    };
    expect(validatePasswordHashConfig(config)).toHaveLength(0);
  });

  it('should reject MD5', () => {
    const config: PasswordHashConfig = {
      algorithm: 'md5',
    };
    const issues = validatePasswordHashConfig(config);
    expect(issues.some(i => i.includes('md5'))).toBe(true);
  });

  it('should reject SHA-256', () => {
    const config: PasswordHashConfig = {
      algorithm: 'sha256',
    };
    const issues = validatePasswordHashConfig(config);
    expect(issues.some(i => i.includes('sha256'))).toBe(true);
  });

  it('should reject low bcrypt cost', () => {
    const config: PasswordHashConfig = {
      algorithm: 'bcrypt',
      iterations: 8,
    };
    const issues = validatePasswordHashConfig(config);
    expect(issues).toContain('bcrypt cost factor should be at least 10');
  });
});

describe('Key Exchange Security', () => {
  function validateDHParams(keyBits: number): { secure: boolean; reason?: string } {
    if (keyBits < 2048) {
      return { secure: false, reason: 'DH key should be at least 2048 bits' };
    }
    
    if (keyBits < 3072) {
      return { secure: true, reason: 'Acceptable, but 3072+ bits recommended' };
    }
    
    return { secure: true };
  }

  it('should reject 1024-bit DH', () => {
    const result = validateDHParams(1024);
    expect(result.secure).toBe(false);
  });

  it('should accept 2048-bit DH with warning', () => {
    const result = validateDHParams(2048);
    expect(result.secure).toBe(true);
    expect(result.reason).toContain('3072+ bits recommended');
  });

  it('should accept 4096-bit DH', () => {
    const result = validateDHParams(4096);
    expect(result.secure).toBe(true);
    expect(result.reason).toBeUndefined();
  });
});

describe('Digital Signature Security', () => {
  function validateSignatureAlgorithm(algorithm: string): { secure: boolean; reason?: string } {
    const insecure = ['md5', 'sha1', 'md5withrsa', 'sha1withrsa'];
    const secure = ['sha256withrsa', 'sha384withrsa', 'sha512withrsa', 'ecdsa-sha256', 'ecdsa-sha384', 'ed25519'];
    
    const lower = algorithm.toLowerCase().replace(/[-_\s]/g, '');
    
    if (insecure.some(i => lower.includes(i.replace(/-/g, '')))) {
      return { secure: false, reason: `${algorithm} is deprecated` };
    }
    
    if (!secure.some(s => lower.includes(s.replace(/-/g, '')))) {
      return { secure: false, reason: 'Unknown signature algorithm' };
    }
    
    return { secure: true };
  }

  it('should reject MD5 signatures', () => {
    expect(validateSignatureAlgorithm('MD5withRSA').secure).toBe(false);
  });

  it('should reject SHA1 signatures', () => {
    expect(validateSignatureAlgorithm('SHA1withRSA').secure).toBe(false);
  });

  it('should accept SHA256 signatures', () => {
    expect(validateSignatureAlgorithm('SHA256withRSA').secure).toBe(true);
  });

  it('should accept ECDSA-SHA256', () => {
    expect(validateSignatureAlgorithm('ECDSA-SHA256').secure).toBe(true);
  });

  it('should accept Ed25519', () => {
    expect(validateSignatureAlgorithm('Ed25519').secure).toBe(true);
  });
});
