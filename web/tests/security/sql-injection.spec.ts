import { describe, it, expect } from 'vitest';

/**
 * Security Tests - SQL Injection Prevention
 * 
 * Unit tests for SQL injection attack detection and prevention
 */

// SQL injection patterns to detect
const SQL_INJECTION_PATTERNS = [
  /('\s*OR\s*'1'\s*=\s*'1)/i,
  /('\s*OR\s*1\s*=\s*1)/i,
  /(;\s*DROP\s+TABLE)/i,
  /(;\s*DELETE\s+FROM)/i,
  /(;\s*UPDATE\s+.+\s+SET)/i,
  /(;\s*INSERT\s+INTO)/i,
  /(UNION\s+SELECT)/i,
  /(UNION\s+ALL\s+SELECT)/i,
  /(--.*)$/m,
  /(\/\*.*\*\/)/,
  /(EXEC\s*\()/i,
  /(EXECUTE\s*\()/i,
  /(xp_cmdshell)/i,
  /(WAITFOR\s+DELAY)/i,
  /(BENCHMARK\s*\()/i,
  /(SLEEP\s*\()/i,
  /(LOAD_FILE\s*\()/i,
  /(INTO\s+OUTFILE)/i,
  /(INTO\s+DUMPFILE)/i,
];

function detectSqlInjection(input: string): { detected: boolean; pattern?: string } {
  if (!input || typeof input !== 'string') {
    return { detected: false };
  }
  
  for (const pattern of SQL_INJECTION_PATTERNS) {
    if (pattern.test(input)) {
      return { detected: true, pattern: pattern.toString() };
    }
  }
  
  return { detected: false };
}

function sanitizeForSql(input: string): string {
  if (!input || typeof input !== 'string') {
    return '';
  }
  
  return input
    .replace(/'/g, "''")
    .replace(/\\/g, '\\\\')
    .replace(/\x00/g, '')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/\x1a/g, '\\Z');
}

function validateIdentifier(identifier: string): boolean {
  // Only allow alphanumeric and underscore
  return /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(identifier);
}

function escapeIdentifier(identifier: string): string {
  if (!validateIdentifier(identifier)) {
    throw new Error('Invalid identifier');
  }
  return `"${identifier}"`;
}

describe('SQL Injection Detection', () => {
  describe('Classic SQL Injection', () => {
    it('should detect OR 1=1 injection', () => {
      expect(detectSqlInjection("' OR '1'='1").detected).toBe(true);
      expect(detectSqlInjection("' OR 1=1--").detected).toBe(true);
    });

    it('should detect UNION SELECT injection', () => {
      expect(detectSqlInjection("' UNION SELECT * FROM users--").detected).toBe(true);
      expect(detectSqlInjection("1 UNION ALL SELECT username, password FROM users").detected).toBe(true);
    });

    it('should detect DROP TABLE injection', () => {
      expect(detectSqlInjection("'; DROP TABLE users;--").detected).toBe(true);
      expect(detectSqlInjection("1; DROP TABLE accounts").detected).toBe(true);
    });

    it('should detect DELETE FROM injection', () => {
      expect(detectSqlInjection("'; DELETE FROM users WHERE 1=1;--").detected).toBe(true);
    });

    it('should detect UPDATE injection', () => {
      expect(detectSqlInjection("'; UPDATE users SET admin=1;--").detected).toBe(true);
    });

    it('should detect INSERT INTO injection', () => {
      expect(detectSqlInjection("'; INSERT INTO users VALUES('hacker', 'pass');--").detected).toBe(true);
    });
  });

  describe('Comment-Based Injection', () => {
    it('should detect single-line comment', () => {
      expect(detectSqlInjection("admin'--").detected).toBe(true);
      expect(detectSqlInjection("1 OR 1=1 -- comment").detected).toBe(true);
    });

    it('should detect multi-line comment', () => {
      expect(detectSqlInjection("admin'/* comment */").detected).toBe(true);
    });
  });

  describe('Time-Based Blind Injection', () => {
    it('should detect WAITFOR DELAY', () => {
      expect(detectSqlInjection("'; WAITFOR DELAY '0:0:5'--").detected).toBe(true);
    });

    it('should detect BENCHMARK', () => {
      expect(detectSqlInjection("' OR BENCHMARK(1000000, SHA1('test'))--").detected).toBe(true);
    });

    it('should detect SLEEP', () => {
      expect(detectSqlInjection("' OR SLEEP(5)--").detected).toBe(true);
    });
  });

  describe('Command Execution Injection', () => {
    it('should detect EXEC', () => {
      expect(detectSqlInjection("'; EXEC('malicious')--").detected).toBe(true);
    });

    it('should detect xp_cmdshell', () => {
      expect(detectSqlInjection("'; EXEC xp_cmdshell 'dir'--").detected).toBe(true);
    });
  });

  describe('File Operation Injection', () => {
    it('should detect LOAD_FILE', () => {
      expect(detectSqlInjection("' UNION SELECT LOAD_FILE('/etc/passwd')--").detected).toBe(true);
    });

    it('should detect INTO OUTFILE', () => {
      expect(detectSqlInjection("' UNION SELECT * INTO OUTFILE '/tmp/data.txt'--").detected).toBe(true);
    });

    it('should detect INTO DUMPFILE', () => {
      expect(detectSqlInjection("' UNION SELECT * INTO DUMPFILE '/tmp/shell.php'--").detected).toBe(true);
    });
  });

  describe('Safe Inputs', () => {
    it('should not flag normal text', () => {
      expect(detectSqlInjection('John Doe').detected).toBe(false);
      expect(detectSqlInjection('user@example.com').detected).toBe(false);
    });

    it('should not flag normal numbers', () => {
      expect(detectSqlInjection('12345').detected).toBe(false);
      expect(detectSqlInjection('100.50').detected).toBe(false);
    });

    it('should not flag empty input', () => {
      expect(detectSqlInjection('').detected).toBe(false);
    });

    it('should handle null/undefined', () => {
      expect(detectSqlInjection(null as any).detected).toBe(false);
      expect(detectSqlInjection(undefined as any).detected).toBe(false);
    });
  });
});

describe('SQL Input Sanitization', () => {
  describe('Quote Escaping', () => {
    it('should escape single quotes', () => {
      expect(sanitizeForSql("O'Brien")).toBe("O''Brien");
      expect(sanitizeForSql("It's a test")).toBe("It''s a test");
    });

    it('should escape multiple quotes', () => {
      expect(sanitizeForSql("'''")).toBe("''''''");
    });
  });

  describe('Special Character Escaping', () => {
    it('should escape backslashes', () => {
      expect(sanitizeForSql('path\\to\\file')).toBe('path\\\\to\\\\file');
    });

    it('should remove null bytes', () => {
      expect(sanitizeForSql('test\x00injection')).toBe('testinjection');
    });

    it('should escape newlines', () => {
      expect(sanitizeForSql('line1\nline2')).toBe('line1\\nline2');
      expect(sanitizeForSql('line1\rline2')).toBe('line1\\rline2');
    });

    it('should escape SUB character', () => {
      expect(sanitizeForSql('test\x1aend')).toBe('test\\Zend');
    });
  });

  describe('Edge Cases', () => {
    it('should handle empty string', () => {
      expect(sanitizeForSql('')).toBe('');
    });

    it('should handle null/undefined', () => {
      expect(sanitizeForSql(null as any)).toBe('');
      expect(sanitizeForSql(undefined as any)).toBe('');
    });

    it('should preserve safe text', () => {
      expect(sanitizeForSql('Hello World')).toBe('Hello World');
      expect(sanitizeForSql('user123')).toBe('user123');
    });
  });
});

describe('Identifier Validation', () => {
  describe('Valid Identifiers', () => {
    it('should accept alphanumeric identifiers', () => {
      expect(validateIdentifier('users')).toBe(true);
      expect(validateIdentifier('user_table')).toBe(true);
      expect(validateIdentifier('Users123')).toBe(true);
    });

    it('should accept underscore prefix', () => {
      expect(validateIdentifier('_private')).toBe(true);
      expect(validateIdentifier('_temp_table')).toBe(true);
    });
  });

  describe('Invalid Identifiers', () => {
    it('should reject starting with number', () => {
      expect(validateIdentifier('123users')).toBe(false);
      expect(validateIdentifier('1table')).toBe(false);
    });

    it('should reject special characters', () => {
      expect(validateIdentifier('users;DROP')).toBe(false);
      expect(validateIdentifier('user-name')).toBe(false);
      expect(validateIdentifier("users'")).toBe(false);
    });

    it('should reject spaces', () => {
      expect(validateIdentifier('user table')).toBe(false);
      expect(validateIdentifier(' users')).toBe(false);
    });

    it('should reject empty string', () => {
      expect(validateIdentifier('')).toBe(false);
    });

    it('should reject SQL keywords with injection', () => {
      expect(validateIdentifier('users--')).toBe(false);
      expect(validateIdentifier('table/*')).toBe(false);
    });
  });
});

describe('Identifier Escaping', () => {
  it('should properly quote valid identifier', () => {
    expect(escapeIdentifier('users')).toBe('"users"');
    expect(escapeIdentifier('user_table')).toBe('"user_table"');
  });

  it('should throw for invalid identifier', () => {
    expect(() => escapeIdentifier('users;DROP TABLE')).toThrow('Invalid identifier');
    expect(() => escapeIdentifier('')).toThrow('Invalid identifier');
  });
});

describe('Parameterized Query Simulation', () => {
  interface QueryParam {
    value: string | number | boolean | null;
    type: 'string' | 'number' | 'boolean' | 'null';
  }

  function prepareParam(param: QueryParam): string {
    switch (param.type) {
      case 'string':
        return `'${sanitizeForSql(String(param.value))}'`;
      case 'number':
        const num = Number(param.value);
        if (isNaN(num)) throw new Error('Invalid number');
        return String(num);
      case 'boolean':
        return param.value ? 'TRUE' : 'FALSE';
      case 'null':
        return 'NULL';
      default:
        throw new Error('Unknown type');
    }
  }

  it('should safely prepare string parameters', () => {
    const param: QueryParam = { value: "O'Malley", type: 'string' };
    expect(prepareParam(param)).toBe("'O''Malley'");
  });

  it('should safely prepare number parameters', () => {
    const param: QueryParam = { value: 42, type: 'number' };
    expect(prepareParam(param)).toBe('42');
  });

  it('should reject invalid numbers', () => {
    const param: QueryParam = { value: '1 OR 1=1', type: 'number' };
    expect(() => prepareParam(param)).toThrow('Invalid number');
  });

  it('should safely prepare boolean parameters', () => {
    expect(prepareParam({ value: true, type: 'boolean' })).toBe('TRUE');
    expect(prepareParam({ value: false, type: 'boolean' })).toBe('FALSE');
  });

  it('should safely prepare null parameters', () => {
    const param: QueryParam = { value: null, type: 'null' };
    expect(prepareParam(param)).toBe('NULL');
  });

  it('should prevent injection via string parameter', () => {
    const param: QueryParam = { value: "'; DROP TABLE users;--", type: 'string' };
    const prepared = prepareParam(param);
    // The string is escaped, making the DROP TABLE ineffective as SQL
    // The quotes are properly escaped, so SQL parser won't execute it
    expect(prepared).toContain("''"); // Single quote is escaped
    expect(prepared.startsWith("'")).toBe(true); // Wrapped in quotes
    expect(prepared.endsWith("'")).toBe(true);
  });
});
