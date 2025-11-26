type SecurityHeader = {
  key: string;
  value: string;
};

interface SecurityHeaderStrategy {
  getHeaders(): SecurityHeader[];
}

class ContentSecurityPolicyStrategy implements SecurityHeaderStrategy {
  private readonly directives: Record<string, string[]>;

  constructor() {
    this.directives = {
      'default-src': ["'self'"],
      'script-src': ["'self'", "'unsafe-inline'", "'unsafe-eval'", 'https://vercel.live'],
      'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
      'img-src': ["'self'", 'data:', 'blob:', 'https:'],
      'font-src': ["'self'", 'https://fonts.gstatic.com'],
      'connect-src': ["'self'", 'https://*.supabase.co', 'wss://*.supabase.co', 'https://vercel.live'],
      'frame-ancestors': ["'self'"],
      'form-action': ["'self'"],
      'base-uri': ["'self'"],
      'object-src': ["'none'"],
      'upgrade-insecure-requests': [],
    };
  }

  getHeaders(): SecurityHeader[] {
    const policy = Object.entries(this.directives)
      .map(([directive, values]) => 
        values.length > 0 ? `${directive} ${values.join(' ')}` : directive
      )
      .join('; ');

    return [{ key: 'Content-Security-Policy', value: policy }];
  }
}

class TransportSecurityStrategy implements SecurityHeaderStrategy {
  private readonly maxAge: number;
  private readonly includeSubDomains: boolean;
  private readonly preload: boolean;

  constructor(maxAge = 63072000, includeSubDomains = true, preload = true) {
    this.maxAge = maxAge;
    this.includeSubDomains = includeSubDomains;
    this.preload = preload;
  }

  getHeaders(): SecurityHeader[] {
    const parts = [`max-age=${this.maxAge}`];
    if (this.includeSubDomains) parts.push('includeSubDomains');
    if (this.preload) parts.push('preload');

    return [{ key: 'Strict-Transport-Security', value: parts.join('; ') }];
  }
}

class FrameOptionsStrategy implements SecurityHeaderStrategy {
  private readonly option: 'DENY' | 'SAMEORIGIN';

  constructor(option: 'DENY' | 'SAMEORIGIN' = 'SAMEORIGIN') {
    this.option = option;
  }

  getHeaders(): SecurityHeader[] {
    return [{ key: 'X-Frame-Options', value: this.option }];
  }
}

class ContentTypeOptionsStrategy implements SecurityHeaderStrategy {
  getHeaders(): SecurityHeader[] {
    return [{ key: 'X-Content-Type-Options', value: 'nosniff' }];
  }
}

class ReferrerPolicyStrategy implements SecurityHeaderStrategy {
  private readonly policy: string;

  constructor(policy = 'strict-origin-when-cross-origin') {
    this.policy = policy;
  }

  getHeaders(): SecurityHeader[] {
    return [{ key: 'Referrer-Policy', value: this.policy }];
  }
}

class PermissionsPolicyStrategy implements SecurityHeaderStrategy {
  private readonly permissions: Record<string, string[]>;

  constructor() {
    this.permissions = {
      'accelerometer': [],
      'camera': [],
      'geolocation': [],
      'gyroscope': [],
      'magnetometer': [],
      'microphone': [],
      'payment': ['self'],
      'usb': [],
    };
  }

  getHeaders(): SecurityHeader[] {
    const policy = Object.entries(this.permissions)
      .map(([feature, allowList]) => 
        allowList.length > 0 ? `${feature}=(${allowList.join(' ')})` : `${feature}=()`
      )
      .join(', ');

    return [{ key: 'Permissions-Policy', value: policy }];
  }
}

class DnsPrefetchStrategy implements SecurityHeaderStrategy {
  getHeaders(): SecurityHeader[] {
    return [{ key: 'X-DNS-Prefetch-Control', value: 'on' }];
  }
}

class XssProtectionStrategy implements SecurityHeaderStrategy {
  getHeaders(): SecurityHeader[] {
    return [{ key: 'X-XSS-Protection', value: '1; mode=block' }];
  }
}

class SecurityHeadersFacade {
  private readonly strategies: SecurityHeaderStrategy[];

  constructor(strategies?: SecurityHeaderStrategy[]) {
    this.strategies = strategies ?? [
      new ContentSecurityPolicyStrategy(),
      new TransportSecurityStrategy(),
      new FrameOptionsStrategy(),
      new ContentTypeOptionsStrategy(),
      new ReferrerPolicyStrategy(),
      new PermissionsPolicyStrategy(),
      new DnsPrefetchStrategy(),
      new XssProtectionStrategy(),
    ];
  }

  getAllHeaders(): SecurityHeader[] {
    return this.strategies.flatMap(strategy => strategy.getHeaders());
  }

  getNextJsHeadersConfig() {
    return [
      {
        source: '/:path*',
        headers: this.getAllHeaders(),
      },
    ];
  }
}

export const securityHeaders = new SecurityHeadersFacade();

export {
  SecurityHeadersFacade,
  ContentSecurityPolicyStrategy,
  TransportSecurityStrategy,
  FrameOptionsStrategy,
  ContentTypeOptionsStrategy,
  ReferrerPolicyStrategy,
  PermissionsPolicyStrategy,
  DnsPrefetchStrategy,
  XssProtectionStrategy,
};

export type { SecurityHeader, SecurityHeaderStrategy };
