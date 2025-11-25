import { describe, it, expect } from 'vitest';
import { htmlSanitizer } from '@/lib/security/htmlSanitizer';
import { attackVectorRegistry } from './attack-vectors';
import { createSanitizerValidator, runSecurityTestSuite } from './validators';

describe('htmlSanitizer', () => {
  const validator = createSanitizerValidator();

  describe('XSS Attack Prevention', () => {
    const xssVectors = attackVectorRegistry.getByCategory('xss');

    it.each(xssVectors.map((v) => [v.name, v]))(
      'should neutralize %s attack',
      (_name, vector) => {
        const result = htmlSanitizer.sanitize(vector.payload);
        const isSecure = validator.validate(vector.payload, result);
        expect(isSecure).toBe(true);
      }
    );
  });

  describe('Encoding Bypass Prevention', () => {
    const encodingVectors = attackVectorRegistry.getByCategory('encoding');

    it.each(encodingVectors.map((v) => [v.name, v]))(
      'should handle %s encoding bypass attempt',
      (_name, vector) => {
        const result = htmlSanitizer.sanitize(vector.payload);
        const isSecure = validator.validate(vector.payload, result);
        expect(isSecure).toBe(true);
      }
    );
  });

  describe('Overflow Protection', () => {
    const overflowVectors = attackVectorRegistry.getByCategory('overflow');

    it.each(overflowVectors.map((v) => [v.name, v]))(
      'should handle %s overflow attempt',
      (_name, vector) => {
        const result = htmlSanitizer.sanitize(vector.payload);
        expect(result.length).toBeLessThanOrEqual(1000);
      }
    );
  });

  describe('Injection Attack Handling', () => {
    const injectionVectors = attackVectorRegistry.getByCategory('injection');

    it.each(injectionVectors.map((v) => [v.name, v]))(
      'should pass through %s (handled by parameterized queries)',
      (_name, vector) => {
        const result = htmlSanitizer.sanitize(vector.payload);
        expect(typeof result).toBe('string');
      }
    );
  });

  describe('Edge Cases', () => {
    it('should handle null input', () => {
      expect(htmlSanitizer.sanitize(null as unknown as string)).toBe('');
    });

    it('should handle undefined input', () => {
      expect(htmlSanitizer.sanitize(undefined as unknown as string)).toBe('');
    });

    it('should handle empty string', () => {
      expect(htmlSanitizer.sanitize('')).toBe('');
    });

    it('should handle numeric input', () => {
      expect(htmlSanitizer.sanitize(123 as unknown as string)).toBe('');
    });

    it('should preserve legitimate text', () => {
      const text = 'Hello, this is a normal message!';
      expect(htmlSanitizer.sanitize(text)).toBe(text);
    });

    it('should trim whitespace', () => {
      expect(htmlSanitizer.sanitize('  hello  ')).toBe('hello');
    });

    it('should preserve special characters in text', () => {
      const text = 'Price: $50 & 10% discount!';
      expect(htmlSanitizer.sanitize(text)).toContain('$50');
    });
  });

  describe('Full Security Suite', () => {
    it('should pass all attack vectors', () => {
      const allVectors = attackVectorRegistry.getAll();
      const results = runSecurityTestSuite(
        allVectors,
        (input) => htmlSanitizer.sanitize(input),
        validator
      );

      const failures = results.filter((r) => !r.passed);
      
      if (failures.length > 0) {
        console.log('Failed vectors:', failures.map((f) => f.vector.name));
      }

      expect(failures.length).toBe(0);
    });
  });
});
