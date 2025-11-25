export interface AttackVector {
  readonly name: string;
  readonly payload: string;
  readonly category: AttackCategory;
}

export type AttackCategory = 'xss' | 'injection' | 'overflow' | 'encoding';

export interface AttackStrategy {
  readonly category: AttackCategory;
  getVectors(): readonly AttackVector[];
}

class XssAttackStrategy implements AttackStrategy {
  readonly category: AttackCategory = 'xss';

  private readonly vectors: readonly AttackVector[] = [
    { name: 'script-tag', payload: '<script>alert("xss")</script>', category: 'xss' },
    { name: 'img-onerror', payload: '<img src=x onerror=alert("xss")>', category: 'xss' },
    { name: 'svg-onload', payload: '<svg onload=alert("xss")>', category: 'xss' },
    { name: 'event-handler', payload: '<div onclick="alert(\'xss\')">click</div>', category: 'xss' },
    { name: 'javascript-href', payload: '<a href="javascript:alert(\'xss\')">link</a>', category: 'xss' },
    { name: 'iframe-injection', payload: '<iframe src="javascript:alert(\'xss\')"></iframe>', category: 'xss' },
    { name: 'style-expression', payload: '<div style="background:url(javascript:alert(\'xss\'))"></div>', category: 'xss' },
    { name: 'data-uri', payload: '<a href="data:text/html,<script>alert(\'xss\')</script>">click</a>', category: 'xss' },
    { name: 'template-literal', payload: '${alert("xss")}', category: 'xss' },
    { name: 'nested-tags', payload: '<<script>script>alert("xss")<</script>/script>', category: 'xss' },
  ];

  getVectors(): readonly AttackVector[] {
    return this.vectors;
  }
}

class EncodingBypassStrategy implements AttackStrategy {
  readonly category: AttackCategory = 'encoding';

  private readonly vectors: readonly AttackVector[] = [
    { name: 'html-entity-lt-gt', payload: '&lt;script&gt;alert("xss")&lt;/script&gt;', category: 'encoding' },
    { name: 'double-encoding', payload: '&amp;lt;script&amp;gt;', category: 'encoding' },
    { name: 'hex-encoding', payload: '&#x3C;script&#x3E;alert("xss")&#x3C;/script&#x3E;', category: 'encoding' },
    { name: 'decimal-encoding', payload: '&#60;script&#62;alert("xss")&#60;/script&#62;', category: 'encoding' },
    { name: 'unicode-escape', payload: '\u003cscript\u003ealert("xss")\u003c/script\u003e', category: 'encoding' },
    { name: 'mixed-case', payload: '<ScRiPt>alert("xss")</sCrIpT>', category: 'encoding' },
    { name: 'null-byte', payload: '<scr\x00ipt>alert("xss")</script>', category: 'encoding' },
  ];

  getVectors(): readonly AttackVector[] {
    return this.vectors;
  }
}

class InjectionAttackStrategy implements AttackStrategy {
  readonly category: AttackCategory = 'injection';

  private readonly vectors: readonly AttackVector[] = [
    { name: 'sql-union', payload: "' UNION SELECT * FROM users--", category: 'injection' },
    { name: 'sql-drop', payload: "'; DROP TABLE users;--", category: 'injection' },
    { name: 'nosql-injection', payload: '{"$gt": ""}', category: 'injection' },
    { name: 'command-injection', payload: '; rm -rf /', category: 'injection' },
    { name: 'path-traversal', payload: '../../../etc/passwd', category: 'injection' },
    { name: 'ldap-injection', payload: '*)(uid=*))(|(uid=*', category: 'injection' },
  ];

  getVectors(): readonly AttackVector[] {
    return this.vectors;
  }
}

class OverflowAttackStrategy implements AttackStrategy {
  readonly category: AttackCategory = 'overflow';

  private readonly vectors: readonly AttackVector[] = [
    { name: 'long-string-1k', payload: 'A'.repeat(1000), category: 'overflow' },
    { name: 'long-string-10k', payload: 'B'.repeat(10000), category: 'overflow' },
    { name: 'deep-nesting', payload: '<'.repeat(100) + 'div' + '>'.repeat(100), category: 'overflow' },
    { name: 'repeated-entities', payload: '&lt;'.repeat(500), category: 'overflow' },
  ];

  getVectors(): readonly AttackVector[] {
    return this.vectors;
  }
}

export class AttackVectorRegistry {
  private readonly strategies: Map<AttackCategory, AttackStrategy> = new Map();

  constructor() {
    this.register(new XssAttackStrategy());
    this.register(new EncodingBypassStrategy());
    this.register(new InjectionAttackStrategy());
    this.register(new OverflowAttackStrategy());
  }

  private register(strategy: AttackStrategy): void {
    this.strategies.set(strategy.category, strategy);
  }

  getByCategory(category: AttackCategory): readonly AttackVector[] {
    return this.strategies.get(category)?.getVectors() ?? [];
  }

  getAll(): readonly AttackVector[] {
    return Array.from(this.strategies.values()).flatMap((s) => s.getVectors());
  }

  getCategories(): readonly AttackCategory[] {
    return Array.from(this.strategies.keys());
  }
}

export const attackVectorRegistry = new AttackVectorRegistry();
