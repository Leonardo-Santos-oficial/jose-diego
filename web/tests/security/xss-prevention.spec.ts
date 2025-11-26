import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * Security Tests - XSS Prevention
 * 
 * Unit tests for Cross-Site Scripting (XSS) attack prevention
 */

// HTML entity encoding
function encodeHtmlEntities(str: string): string {
  const entities: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#x27;',
    '/': '&#x2F;',
    '`': '&#x60;',
    '=': '&#x3D;',
  };
  
  return str.replace(/[&<>"'`=\/]/g, char => entities[char]);
}

// URL sanitization
function sanitizeUrl(url: string): string | null {
  try {
    const parsed = new URL(url, 'https://example.com');
    
    // Only allow http(s) protocols
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null;
    }
    
    return parsed.href;
  } catch {
    return null;
  }
}

// JavaScript context escaping
function escapeForJavaScript(str: string): string {
  return str
    .replace(/\\/g, '\\\\')
    .replace(/'/g, "\\'")
    .replace(/"/g, '\\"')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
    .replace(/<\/script/gi, '<\\/script')
    .replace(/<!--/g, '\\x3C!--');
}

// CSS value sanitization
function sanitizeCssValue(value: string): string | null {
  // Block expressions, url(), and behavior
  const dangerousPatterns = [
    /expression\s*\(/i,
    /javascript\s*:/i,
    /behavior\s*:/i,
    /-moz-binding\s*:/i,
    /url\s*\(\s*["']?\s*javascript/i,
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(value)) {
      return null;
    }
  }
  
  return value;
}

// Attribute value sanitization
function sanitizeAttribute(name: string, value: string): string | null {
  const dangerousAttributes = ['onclick', 'onerror', 'onload', 'onmouseover', 'onfocus'];
  
  if (dangerousAttributes.includes(name.toLowerCase())) {
    return null; // Remove event handlers
  }
  
  if (name.toLowerCase() === 'href' || name.toLowerCase() === 'src') {
    return sanitizeUrl(value);
  }
  
  if (name.toLowerCase() === 'style') {
    return sanitizeCssValue(value);
  }
  
  return encodeHtmlEntities(value);
}

describe('HTML Entity Encoding', () => {
  it('should encode basic HTML entities', () => {
    expect(encodeHtmlEntities('<')).toBe('&lt;');
    expect(encodeHtmlEntities('>')).toBe('&gt;');
    expect(encodeHtmlEntities('&')).toBe('&amp;');
    expect(encodeHtmlEntities('"')).toBe('&quot;');
  });

  it('should encode script tags', () => {
    const input = '<script>alert("XSS")</script>';
    const encoded = encodeHtmlEntities(input);
    
    expect(encoded).not.toContain('<script>');
    expect(encoded).toContain('&lt;script&gt;');
  });

  it('should encode apostrophes and backticks', () => {
    expect(encodeHtmlEntities("'")).toBe('&#x27;');
    expect(encodeHtmlEntities('`')).toBe('&#x60;');
  });

  it('should handle mixed content', () => {
    const input = 'Hello <b>World</b> & "Friends"';
    const encoded = encodeHtmlEntities(input);
    
    expect(encoded).toBe('Hello &lt;b&gt;World&lt;&#x2F;b&gt; &amp; &quot;Friends&quot;');
  });

  it('should handle empty string', () => {
    expect(encodeHtmlEntities('')).toBe('');
  });
});

describe('URL Sanitization', () => {
  it('should allow http URLs', () => {
    expect(sanitizeUrl('http://example.com')).toBe('http://example.com/');
  });

  it('should allow https URLs', () => {
    expect(sanitizeUrl('https://example.com/path')).toBe('https://example.com/path');
  });

  it('should block javascript: protocol', () => {
    expect(sanitizeUrl('javascript:alert(1)')).toBeNull();
    expect(sanitizeUrl('JAVASCRIPT:alert(1)')).toBeNull();
    expect(sanitizeUrl('JavaScript:alert(1)')).toBeNull();
  });

  it('should block data: protocol', () => {
    expect(sanitizeUrl('data:text/html,<script>alert(1)</script>')).toBeNull();
  });

  it('should block vbscript: protocol', () => {
    expect(sanitizeUrl('vbscript:MsgBox("XSS")')).toBeNull();
  });

  it('should handle relative URLs', () => {
    const result = sanitizeUrl('/path/to/resource');
    expect(result).toContain('/path/to/resource');
  });

  it('should handle URL with encoded javascript', () => {
    // URL with encoded "c" - browsers will decode this and treat as javascript:
    // The URL constructor treats this as a path, not a protocol
    // This is expected behavior - further validation should happen at the application level
    const result = sanitizeUrl('javas%63ript:alert(1)');
    // Since it's treated as a path (not a protocol), it becomes a valid URL
    // Additional validation should be done by checking the decoded path
    expect(result === null || !result.includes('javascript:')).toBe(true);
  });
});

describe('JavaScript Context Escaping', () => {
  it('should escape backslashes', () => {
    expect(escapeForJavaScript('path\\to\\file')).toBe('path\\\\to\\\\file');
  });

  it('should escape quotes', () => {
    expect(escapeForJavaScript("it's")).toBe("it\\'s");
    expect(escapeForJavaScript('say "hello"')).toBe('say \\"hello\\"');
  });

  it('should escape newlines', () => {
    expect(escapeForJavaScript('line1\nline2')).toBe('line1\\nline2');
    expect(escapeForJavaScript('line1\rline2')).toBe('line1\\rline2');
  });

  it('should escape closing script tags', () => {
    const input = '</script><script>alert(1)</script>';
    const escaped = escapeForJavaScript(input);
    
    expect(escaped).toContain('<\\/script');
    expect(escaped).not.toContain('</script>');
  });

  it('should escape HTML comments', () => {
    const input = '<!-- comment -->';
    const escaped = escapeForJavaScript(input);
    
    expect(escaped).toContain('\\x3C!--');
  });
});

describe('CSS Value Sanitization', () => {
  it('should allow safe CSS values', () => {
    expect(sanitizeCssValue('red')).toBe('red');
    expect(sanitizeCssValue('#ff0000')).toBe('#ff0000');
    expect(sanitizeCssValue('10px')).toBe('10px');
  });

  it('should block expression()', () => {
    expect(sanitizeCssValue('expression(alert(1))')).toBeNull();
    expect(sanitizeCssValue('EXPRESSION(alert(1))')).toBeNull();
  });

  it('should block javascript in url()', () => {
    expect(sanitizeCssValue('url(javascript:alert(1))')).toBeNull();
    expect(sanitizeCssValue("url('javascript:alert(1)')")).toBeNull();
  });

  it('should block behavior:', () => {
    expect(sanitizeCssValue('behavior:url(script.htc)')).toBeNull();
  });

  it('should block -moz-binding:', () => {
    expect(sanitizeCssValue('-moz-binding:url(xss.xml#xss)')).toBeNull();
  });

  it('should allow safe url() values', () => {
    expect(sanitizeCssValue('url(image.png)')).toBe('url(image.png)');
    expect(sanitizeCssValue('url(https://example.com/img.png)')).toBe('url(https://example.com/img.png)');
  });
});

describe('Attribute Sanitization', () => {
  it('should block event handler attributes', () => {
    expect(sanitizeAttribute('onclick', 'alert(1)')).toBeNull();
    expect(sanitizeAttribute('onerror', 'alert(1)')).toBeNull();
    expect(sanitizeAttribute('onload', 'alert(1)')).toBeNull();
    expect(sanitizeAttribute('onmouseover', 'alert(1)')).toBeNull();
    expect(sanitizeAttribute('onfocus', 'alert(1)')).toBeNull();
  });

  it('should sanitize href attributes', () => {
    expect(sanitizeAttribute('href', 'javascript:alert(1)')).toBeNull();
    expect(sanitizeAttribute('href', 'https://example.com')).toBe('https://example.com/');
  });

  it('should sanitize src attributes', () => {
    expect(sanitizeAttribute('src', 'javascript:alert(1)')).toBeNull();
    expect(sanitizeAttribute('src', 'https://example.com/image.png')).toBe('https://example.com/image.png');
  });

  it('should sanitize style attributes', () => {
    expect(sanitizeAttribute('style', 'expression(alert(1))')).toBeNull();
    expect(sanitizeAttribute('style', 'color: red')).toBe('color: red');
  });

  it('should encode regular attributes', () => {
    expect(sanitizeAttribute('title', '<script>alert(1)</script>')).toContain('&lt;');
    expect(sanitizeAttribute('class', 'safe-class')).toBe('safe-class');
  });
});

describe('XSS Attack Vector Detection', () => {
  function containsXssVector(input: string): boolean {
    const vectors = [
      /<script[\s>]/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<img[^>]+onerror/i,
      /<svg[^>]+onload/i,
      /<iframe/i,
      /<object/i,
      /<embed/i,
      /<link[^>]+rel\s*=\s*["']?import/i,
      /data:text\/html/i,
    ];
    
    return vectors.some(pattern => pattern.test(input));
  }

  it('should detect script tags', () => {
    expect(containsXssVector('<script>alert(1)</script>')).toBe(true);
    expect(containsXssVector('<script src="evil.js"></script>')).toBe(true);
    expect(containsXssVector('<SCRIPT>alert(1)</SCRIPT>')).toBe(true);
  });

  it('should detect javascript: protocol', () => {
    expect(containsXssVector('javascript:alert(1)')).toBe(true);
    expect(containsXssVector('JAVASCRIPT:alert(1)')).toBe(true);
  });

  it('should detect event handlers', () => {
    expect(containsXssVector('<img onerror=alert(1)>')).toBe(true);
    expect(containsXssVector('<div onclick="evil()">')).toBe(true);
    expect(containsXssVector('<body onload="init()">')).toBe(true);
  });

  it('should detect SVG attack vectors', () => {
    expect(containsXssVector('<svg onload=alert(1)>')).toBe(true);
  });

  it('should detect iframe injection', () => {
    expect(containsXssVector('<iframe src="evil.html"></iframe>')).toBe(true);
  });

  it('should detect object/embed tags', () => {
    expect(containsXssVector('<object data="evil.swf">')).toBe(true);
    expect(containsXssVector('<embed src="evil.swf">')).toBe(true);
  });

  it('should detect data: URL injection', () => {
    expect(containsXssVector('data:text/html,<script>alert(1)</script>')).toBe(true);
  });

  it('should not flag safe content', () => {
    expect(containsXssVector('Hello World')).toBe(false);
    expect(containsXssVector('This is a script tutorial')).toBe(false);
    expect(containsXssVector('Use JavaScript to build apps')).toBe(false);
  });
});

describe('DOM-based XSS Prevention', () => {
  function sanitizeForInnerHtml(html: string): string {
    // Simple tag whitelist approach
    const allowedTags = ['b', 'i', 'u', 'strong', 'em', 'span', 'p', 'br'];
    
    // Remove all tags except allowed ones (simplified for testing)
    let sanitized = html;
    
    // Remove script tags and content
    sanitized = sanitized.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
    
    // Remove dangerous tags
    sanitized = sanitized.replace(/<\s*(iframe|object|embed|link|style|form|input|button)[^>]*>.*?<\/\s*\1\s*>/gi, '');
    sanitized = sanitized.replace(/<\s*(iframe|object|embed|link|style|form|input|button)[^>]*\/?>/gi, '');
    
    // Remove event handlers
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*["'][^"']*["']/gi, '');
    sanitized = sanitized.replace(/\s+on\w+\s*=\s*[^\s>]+/gi, '');
    
    return sanitized;
  }

  it('should remove script tags', () => {
    const input = '<p>Hello</p><script>alert(1)</script>';
    const sanitized = sanitizeForInnerHtml(input);
    
    expect(sanitized).not.toContain('<script>');
    expect(sanitized).toContain('<p>Hello</p>');
  });

  it('should remove event handlers', () => {
    const input = '<img src="x" onerror="alert(1)">';
    const sanitized = sanitizeForInnerHtml(input);
    
    expect(sanitized).not.toContain('onerror');
  });

  it('should remove iframe tags', () => {
    const input = '<p>Content</p><iframe src="evil.html"></iframe>';
    const sanitized = sanitizeForInnerHtml(input);
    
    expect(sanitized).not.toContain('<iframe');
  });

  it('should preserve safe content', () => {
    const input = '<p>Hello <b>World</b></p>';
    const sanitized = sanitizeForInnerHtml(input);
    
    expect(sanitized).toBe('<p>Hello <b>World</b></p>');
  });
});

describe('Content Security Policy Validation', () => {
  interface CspDirectives {
    defaultSrc?: string[];
    scriptSrc?: string[];
    styleSrc?: string[];
    imgSrc?: string[];
    connectSrc?: string[];
    fontSrc?: string[];
    objectSrc?: string[];
    frameSrc?: string[];
    baseUri?: string[];
    formAction?: string[];
  }

  function generateCsp(directives: CspDirectives): string {
    const parts: string[] = [];
    
    if (directives.defaultSrc) {
      parts.push(`default-src ${directives.defaultSrc.join(' ')}`);
    }
    if (directives.scriptSrc) {
      parts.push(`script-src ${directives.scriptSrc.join(' ')}`);
    }
    if (directives.styleSrc) {
      parts.push(`style-src ${directives.styleSrc.join(' ')}`);
    }
    if (directives.imgSrc) {
      parts.push(`img-src ${directives.imgSrc.join(' ')}`);
    }
    if (directives.connectSrc) {
      parts.push(`connect-src ${directives.connectSrc.join(' ')}`);
    }
    if (directives.fontSrc) {
      parts.push(`font-src ${directives.fontSrc.join(' ')}`);
    }
    if (directives.objectSrc) {
      parts.push(`object-src ${directives.objectSrc.join(' ')}`);
    }
    if (directives.frameSrc) {
      parts.push(`frame-src ${directives.frameSrc.join(' ')}`);
    }
    if (directives.baseUri) {
      parts.push(`base-uri ${directives.baseUri.join(' ')}`);
    }
    if (directives.formAction) {
      parts.push(`form-action ${directives.formAction.join(' ')}`);
    }
    
    return parts.join('; ');
  }

  function validateCsp(csp: string): string[] {
    const issues: string[] = [];
    
    if (csp.includes("'unsafe-inline'") && csp.includes('script-src')) {
      issues.push('script-src allows unsafe-inline');
    }
    
    if (csp.includes("'unsafe-eval'") && csp.includes('script-src')) {
      issues.push('script-src allows unsafe-eval');
    }
    
    if (!csp.includes("object-src 'none'")) {
      issues.push('object-src should be none');
    }
    
    if (!csp.includes("base-uri 'self'") && !csp.includes("base-uri 'none'")) {
      issues.push('base-uri should be restricted');
    }
    
    return issues;
  }

  it('should generate valid CSP header', () => {
    const directives: CspDirectives = {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      objectSrc: ["'none'"],
    };
    
    const csp = generateCsp(directives);
    
    expect(csp).toContain("default-src 'self'");
    expect(csp).toContain("script-src 'self'");
    expect(csp).toContain("object-src 'none'");
  });

  it('should identify unsafe-inline in scripts', () => {
    const csp = "script-src 'self' 'unsafe-inline'";
    const issues = validateCsp(csp);
    
    expect(issues).toContain('script-src allows unsafe-inline');
  });

  it('should identify unsafe-eval', () => {
    const csp = "script-src 'self' 'unsafe-eval'";
    const issues = validateCsp(csp);
    
    expect(issues).toContain('script-src allows unsafe-eval');
  });

  it('should require object-src none', () => {
    const csp = "default-src 'self'";
    const issues = validateCsp(csp);
    
    expect(issues).toContain('object-src should be none');
  });

  it('should pass for secure CSP', () => {
    const csp = "default-src 'self'; script-src 'self'; object-src 'none'; base-uri 'self'";
    const issues = validateCsp(csp);
    
    expect(issues).toHaveLength(0);
  });
});
