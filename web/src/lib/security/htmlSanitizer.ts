import DOMPurify from 'isomorphic-dompurify';

export interface Sanitizer {
  sanitize(input: string): string;
}

export class DomPurifySanitizer implements Sanitizer {
  sanitize(input: string): string {
    return DOMPurify.sanitize(input, {
      ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'a'],
      ALLOWED_ATTR: ['href', 'target', 'rel'],
    });
  }
}

export const htmlSanitizer = new DomPurifySanitizer();
