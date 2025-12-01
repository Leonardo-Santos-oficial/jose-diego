import { describe, it, expect } from 'vitest';
import { DefaultFileValidator } from '../validators/fileValidator';
import { UPLOAD_CONFIGS } from '../types';

describe('DefaultFileValidator', () => {
  const validator = new DefaultFileValidator();

  describe('validate for avatar', () => {
    const config = UPLOAD_CONFIGS.avatar;

    it('should accept valid JPEG image under size limit', () => {
      const file = new File(['x'.repeat(1024)], 'avatar.jpg', { type: 'image/jpeg' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should accept valid PNG image', () => {
      const file = new File(['x'.repeat(1024)], 'avatar.png', { type: 'image/png' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(true);
    });

    it('should accept valid WebP image', () => {
      const file = new File(['x'.repeat(1024)], 'avatar.webp', { type: 'image/webp' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(true);
    });

    it('should accept valid GIF image', () => {
      const file = new File(['x'.repeat(1024)], 'avatar.gif', { type: 'image/gif' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(true);
    });

    it('should reject file exceeding size limit (2MB)', () => {
      const largeContent = 'x'.repeat(3 * 1024 * 1024); // 3MB
      const file = new File([largeContent], 'large.jpg', { type: 'image/jpeg' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('2MB');
    });

    it('should reject non-image file types', () => {
      const file = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Tipo de arquivo não permitido');
    });

    it('should reject text files', () => {
      const file = new File(['hello'], 'test.txt', { type: 'text/plain' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(false);
    });

    it('should accept empty files (size validation only checks max)', () => {
      const file = new File([], 'empty.jpg', { type: 'image/jpeg' });
      const result = validator.validate(file, config);
      
      // Current implementation only checks max size, not min
      expect(result.valid).toBe(true);
    });
  });

  describe('validate for chat-attachment', () => {
    const config = UPLOAD_CONFIGS['chat-attachment'];

    it('should accept valid JPEG image', () => {
      const file = new File(['x'.repeat(1024)], 'screenshot.jpg', { type: 'image/jpeg' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(true);
    });

    it('should accept PDF documents', () => {
      const file = new File(['%PDF-1.4'], 'document.pdf', { type: 'application/pdf' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(true);
    });

    it('should accept files up to 10MB', () => {
      const content = 'x'.repeat(9 * 1024 * 1024); // 9MB
      const file = new File([content], 'large-image.png', { type: 'image/png' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(true);
    });

    it('should reject files exceeding 10MB', () => {
      const content = 'x'.repeat(11 * 1024 * 1024); // 11MB
      const file = new File([content], 'huge.jpg', { type: 'image/jpeg' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('10MB');
    });

    it('should reject executable files', () => {
      const file = new File(['MZ'], 'virus.exe', { type: 'application/x-msdownload' });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(false);
    });

    it('should reject Word documents', () => {
      const file = new File(['PK'], 'document.docx', { 
        type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' 
      });
      const result = validator.validate(file, config);
      
      expect(result.valid).toBe(false);
    });
  });
});
