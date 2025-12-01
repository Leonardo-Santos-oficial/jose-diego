import { describe, it, expect } from 'vitest';
import { uploadFacade } from '../uploadFacade';

describe('UploadFacade', () => {
  describe('validateFile', () => {
    it('should validate avatar files correctly', () => {
      const validImage = new File(['x'.repeat(1024)], 'avatar.jpg', { type: 'image/jpeg' });
      const result = uploadFacade.validateFile(validImage, 'avatar');
      
      expect(result.valid).toBe(true);
    });

    it('should reject invalid avatar files', () => {
      const pdfFile = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
      const result = uploadFacade.validateFile(pdfFile, 'avatar');
      
      expect(result.valid).toBe(false);
    });

    it('should validate chat attachment files correctly', () => {
      const pdfFile = new File(['%PDF'], 'doc.pdf', { type: 'application/pdf' });
      const result = uploadFacade.validateFile(pdfFile, 'chat-attachment');
      
      expect(result.valid).toBe(true);
    });

    it('should reject oversized avatar files', () => {
      const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'big.jpg', { type: 'image/jpeg' });
      const result = uploadFacade.validateFile(largeFile, 'avatar');
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('2MB');
    });
  });

  describe('getAttachmentType', () => {
    it('should return "image" for image MIME types', () => {
      expect(uploadFacade.getAttachmentType('image/jpeg')).toBe('image');
      expect(uploadFacade.getAttachmentType('image/png')).toBe('image');
      expect(uploadFacade.getAttachmentType('image/webp')).toBe('image');
      expect(uploadFacade.getAttachmentType('image/gif')).toBe('image');
    });

    it('should return "document" for non-image MIME types', () => {
      expect(uploadFacade.getAttachmentType('application/pdf')).toBe('document');
      expect(uploadFacade.getAttachmentType('text/plain')).toBe('document');
      expect(uploadFacade.getAttachmentType('application/json')).toBe('document');
    });

    it('should handle edge cases', () => {
      expect(uploadFacade.getAttachmentType('')).toBe('document');
      expect(uploadFacade.getAttachmentType('unknown/type')).toBe('document');
    });
  });
});
