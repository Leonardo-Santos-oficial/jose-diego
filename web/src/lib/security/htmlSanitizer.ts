export interface Sanitizer {
  sanitize(input: string): string;
}

/**
 * Sanitizador simples que remove todas as tags HTML.
 * Como as mensagens de chat são exibidas como texto puro (não como HTML),
 * basta remover qualquer tag HTML para evitar XSS.
 * Isso evita a dependência de isomorphic-dompurify que não funciona
 * no ambiente serverless da Vercel.
 */
export class SimpleSanitizer implements Sanitizer {
  sanitize(input: string): string {
    if (!input || typeof input !== 'string') {
      return '';
    }
    
    // Remove todas as tags HTML
    let sanitized = input.replace(/<[^>]*>/g, '');
    
    // Decodifica entidades HTML comuns para evitar bypass
    sanitized = sanitized
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#x27;/g, "'")
      .replace(/&#x2F;/g, '/');
    
    // Remove tags novamente após decodificação (proteção contra bypass)
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Limita o tamanho da mensagem (proteção contra spam)
    const MAX_LENGTH = 1000;
    if (sanitized.length > MAX_LENGTH) {
      sanitized = sanitized.substring(0, MAX_LENGTH);
    }
    
    return sanitized.trim();
  }
}

export const htmlSanitizer = new SimpleSanitizer();
